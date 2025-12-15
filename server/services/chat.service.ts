import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { db } from '../db';
import { 
  chatConversations, 
  chatMessages, 
  chatParticipants, 
  chatMessageReads,
  users,
  salons,
  staff
} from '@shared/schema';
import { eq, and, desc, lt, sql } from 'drizzle-orm';
import { verifyAccessToken } from '../utils/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: 'customer' | 'staff' | 'admin';
  salonId?: string;
  staffId?: string;
}

interface TypingStatus {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

interface UserPresence {
  userId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

const connectedUsers = new Map<string, Set<string>>();
const typingUsers = new Map<string, Set<string>>();

let ioInstance: SocketIOServer | null = null;

export function getSocketIO(): SocketIOServer | null {
  return ioInstance;
}

export function initializeChatSocket(httpServer: HTTPServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const salonId = socket.handshake.auth.salonId;
      const staffId = socket.handshake.auth.staffId;
      const userRole = socket.handshake.auth.userRole;
      
      if (!token) {
        return next(new Error('Authentication required - token missing'));
      }

      try {
        const decoded = await verifyAccessToken(token);
        socket.userId = decoded.userId;
        socket.userRole = userRole || 'customer';
        socket.salonId = salonId;
        socket.staffId = staffId;
        
        console.log(`Chat Socket: Authenticated user ${decoded.userId} as ${socket.userRole}`);
        next();
      } catch (tokenError) {
        console.error('Chat Socket: Token verification failed:', tokenError);
        return next(new Error('Invalid or expired token'));
      }
    } catch (error) {
      console.error('Chat Socket: Authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    console.log(`Chat: User ${userId} connected (${socket.userRole})`);

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)!.add(socket.id);

    socket.broadcast.emit('presence:update', {
      userId: userId,
      isOnline: true
    });

    socket.on('conversation:join', async (conversationId: string) => {
      try {
        // Check if user is a participant
        const participant = await db.query.chatParticipants.findFirst({
          where: and(
            eq(chatParticipants.conversationId, conversationId),
            eq(chatParticipants.userId, userId)
          )
        });

        if (participant) {
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${userId} joined conversation ${conversationId}`);
          return;
        }

        // Fallback: Check if user is the salon owner for this conversation
        const conversation = await db.query.chatConversations.findFirst({
          where: eq(chatConversations.id, conversationId)
        });

        if (conversation) {
          const salon = await db.query.salons.findFirst({
            where: eq(salons.id, conversation.salonId)
          });

          if (salon && salon.ownerId === userId) {
            // Add owner as participant for future joins
            await db.insert(chatParticipants).values({
              conversationId,
              userId,
              role: 'staff'
            }).onConflictDoNothing();
            
            socket.join(`conversation:${conversationId}`);
            console.log(`User ${userId} (salon owner) joined conversation ${conversationId}`);
            return;
          }

          // Also check if user is staff of the salon
          const userStaff = await db.query.staff.findFirst({
            where: and(eq(staff.userId, userId), eq(staff.salonId, conversation.salonId))
          });

          if (userStaff) {
            // Add staff as participant for future joins
            await db.insert(chatParticipants).values({
              conversationId,
              userId,
              role: 'staff',
              staffId: userStaff.id
            }).onConflictDoNothing();

            socket.join(`conversation:${conversationId}`);
            console.log(`User ${userId} (staff) joined conversation ${conversationId}`);
          }
        }
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${userId} left conversation ${conversationId}`);
    });

    socket.on('message:send', async (data: {
      conversationId: string;
      body: string;
      messageType?: string;
      attachmentUrl?: string;
      attachmentType?: string;
      attachmentName?: string;
      attachmentSize?: number;
      tempId?: string;
    }) => {
      try {
        const { conversationId, body, messageType = 'text', tempId } = data;

        let participant = await db.query.chatParticipants.findFirst({
          where: and(
            eq(chatParticipants.conversationId, conversationId),
            eq(chatParticipants.userId, userId)
          )
        });

        let senderRole: 'customer' | 'staff' = 'customer';

        if (participant) {
          senderRole = participant.role as 'customer' | 'staff';
        } else {
          // Fallback: Check if user is salon owner or staff
          const conversation = await db.query.chatConversations.findFirst({
            where: eq(chatConversations.id, conversationId)
          });

          if (!conversation) {
            socket.emit('message:error', { tempId, error: 'Conversation not found' });
            return;
          }

          const salon = await db.query.salons.findFirst({
            where: eq(salons.id, conversation.salonId)
          });

          if (salon && salon.ownerId === userId) {
            // Add owner as participant
            await db.insert(chatParticipants).values({
              conversationId,
              userId,
              role: 'staff'
            }).onConflictDoNothing();
            senderRole = 'staff';
          } else {
            const userStaff = await db.query.staff.findFirst({
              where: and(eq(staff.userId, userId), eq(staff.salonId, conversation.salonId))
            });

            if (userStaff) {
              // Add staff as participant
              await db.insert(chatParticipants).values({
                conversationId,
                userId,
                role: 'staff',
                staffId: userStaff.id
              }).onConflictDoNothing();
              senderRole = 'staff';
            } else {
              socket.emit('message:error', { tempId, error: 'Not a participant' });
              return;
            }
          }
        }

        const user = await db.query.users.findFirst({
          where: eq(users.id, userId),
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        });

        const senderName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User' : 'User';

        const [message] = await db.insert(chatMessages).values({
          conversationId,
          senderId: userId,
          senderRole,
          senderName,
          senderAvatar: user?.profileImageUrl,
          messageType,
          body,
          attachmentUrl: data.attachmentUrl,
          attachmentType: data.attachmentType,
          attachmentName: data.attachmentName,
          attachmentSize: data.attachmentSize,
          sentAt: new Date(),
          deliveredAt: new Date()
        }).returning();

        const preview = body?.substring(0, 100) || '';
        await db.update(chatConversations)
          .set({
            lastMessageAt: new Date(),
            lastMessagePreview: preview,
            updatedAt: new Date(),
            ...(senderRole === 'customer' 
              ? { staffUnreadCount: sql`${chatConversations.staffUnreadCount} + 1` }
              : { customerUnreadCount: sql`${chatConversations.customerUnreadCount} + 1` }
            )
          })
          .where(eq(chatConversations.id, conversationId));

        socket.emit('message:ack', { tempId, messageId: message.id });

        io.to(`conversation:${conversationId}`).emit('message:new', {
          ...message,
          tempId
        });

        const conversationKey = `typing:${conversationId}`;
        typingUsers.get(conversationKey)?.delete(userId);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message:error', { 
          tempId: data.tempId, 
          error: 'Failed to send message' 
        });
      }
    });

    socket.on('message:read', async (data: { 
      conversationId: string; 
      messageIds?: string[];
    }) => {
      try {
        const { conversationId, messageIds } = data;

        let participant = await db.query.chatParticipants.findFirst({
          where: and(
            eq(chatParticipants.conversationId, conversationId),
            eq(chatParticipants.userId, userId)
          )
        });

        let readerRole: 'customer' | 'staff' = 'customer';

        if (participant) {
          readerRole = participant.role as 'customer' | 'staff';
        } else {
          // Fallback: Check if user is salon owner or staff
          const conversation = await db.query.chatConversations.findFirst({
            where: eq(chatConversations.id, conversationId)
          });

          if (!conversation) return;

          const salon = await db.query.salons.findFirst({
            where: eq(salons.id, conversation.salonId)
          });

          if (salon && salon.ownerId === userId) {
            // Add owner as participant
            await db.insert(chatParticipants).values({
              conversationId,
              userId,
              role: 'staff'
            }).onConflictDoNothing();
            readerRole = 'staff';
          } else {
            const userStaff = await db.query.staff.findFirst({
              where: and(eq(staff.userId, userId), eq(staff.salonId, conversation.salonId))
            });

            if (userStaff) {
              // Add staff as participant
              await db.insert(chatParticipants).values({
                conversationId,
                userId,
                role: 'staff',
                staffId: userStaff.id
              }).onConflictDoNothing();
              readerRole = 'staff';
            } else {
              // Not a participant and not salon owner/staff
              return;
            }
          }
        }

        await db.update(chatParticipants)
          .set({ lastReadAt: new Date() })
          .where(and(
            eq(chatParticipants.conversationId, conversationId),
            eq(chatParticipants.userId, userId)
          ));

        if (readerRole === 'customer') {
          await db.update(chatConversations)
            .set({ customerUnreadCount: 0 })
            .where(eq(chatConversations.id, conversationId));
        } else {
          await db.update(chatConversations)
            .set({ staffUnreadCount: 0 })
            .where(eq(chatConversations.id, conversationId));
        }

        io.to(`conversation:${conversationId}`).emit('message:read', {
          conversationId,
          userId,
          readAt: new Date()
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    socket.on('typing:start', (conversationId: string) => {
      const conversationKey = `typing:${conversationId}`;
      if (!typingUsers.has(conversationKey)) {
        typingUsers.set(conversationKey, new Set());
      }
      typingUsers.get(conversationKey)!.add(userId);

      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: true
      });
    });

    socket.on('typing:stop', (conversationId: string) => {
      const conversationKey = `typing:${conversationId}`;
      typingUsers.get(conversationKey)?.delete(userId);

      socket.to(`conversation:${conversationId}`).emit('typing:update', {
        conversationId,
        userId,
        isTyping: false
      });
    });

    socket.on('disconnect', () => {
      console.log(`Chat: User ${userId} disconnected`);
      
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
          
          socket.broadcast.emit('presence:update', {
            userId: userId,
            isOnline: false,
            lastSeen: new Date()
          });
        }
      }

      typingUsers.forEach((users, key) => {
        users.delete(userId);
      });
    });
  });

  ioInstance = io;
  console.log('✅ Chat Socket.IO server initialized');
  return io;
}

export function isUserOnline(userId: string): boolean {
  return connectedUsers.has(userId) && connectedUsers.get(userId)!.size > 0;
}

export function getOnlineUsers(): string[] {
  return Array.from(connectedUsers.keys());
}
