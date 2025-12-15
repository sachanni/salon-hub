import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  chatConversations, 
  chatMessages, 
  chatParticipants,
  users,
  salons,
  staff,
  bookings
} from '@shared/schema';
import { eq, and, desc, lt, or, sql } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const createConversationSchema = z.object({
  salonId: z.string(),
  context: z.enum(['pre_booking', 'booking_inquiry', 'support']).optional().default('pre_booking'),
  relatedServiceId: z.string().optional(),
  relatedBookingId: z.string().optional()
});

const sendMessageSchema = z.object({
  body: z.string().min(1).max(4000),
  messageType: z.enum(['text', 'image', 'file', 'system']).optional().default('text'),
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional(),
  attachmentName: z.string().optional(),
  attachmentSize: z.number().optional()
});

router.post('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validation = createConversationSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const { salonId, context, relatedServiceId, relatedBookingId } = validation.data;

    const salon = await db.query.salons.findFirst({
      where: eq(salons.id, salonId)
    });

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const existingConversation = await db.query.chatConversations.findFirst({
      where: and(
        eq(chatConversations.salonId, salonId),
        eq(chatConversations.customerId, userId),
        eq(chatConversations.status, 'active')
      )
    });

    if (existingConversation) {
      return res.json({ 
        conversation: existingConversation,
        isNew: false 
      });
    }

    const [conversation] = await db.insert(chatConversations).values({
      salonId,
      customerId: userId,
      context,
      relatedServiceId,
      relatedBookingId,
      status: 'active'
    }).returning();

    await db.insert(chatParticipants).values({
      conversationId: conversation.id,
      userId,
      role: 'customer'
    });

    // Add salon owner as participant first
    if (salon.ownerId) {
      await db.insert(chatParticipants).values({
        conversationId: conversation.id,
        userId: salon.ownerId,
        role: 'staff'
      }).onConflictDoNothing();
    }

    // Add staff members as participants
    const salonStaff = await db.query.staff.findMany({
      where: eq(staff.salonId, salonId),
      limit: 5
    });

    for (const staffMember of salonStaff) {
      if (staffMember.userId) {
        await db.insert(chatParticipants).values({
          conversationId: conversation.id,
          userId: staffMember.userId,
          role: 'staff',
          staffId: staffMember.id
        }).onConflictDoNothing();
      }
    }

    const [systemMessage] = await db.insert(chatMessages).values({
      conversationId: conversation.id,
      senderId: userId,
      senderRole: 'customer',
      messageType: 'system',
      body: `Chat started with ${salon.name}`,
      sentAt: new Date()
    }).returning();

    res.status(201).json({ 
      conversation,
      isNew: true 
    });

  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

router.get('/conversations', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const role = req.query.role as string;
    const status = (req.query.status as string) || 'active';

    let conversations;

    if (role === 'staff') {
      const requestedSalonId = req.query.salonId as string;
      let salonIdForQuery: string | null = null;
      
      if (requestedSalonId) {
        const userSalon = await db.query.salons.findFirst({
          where: eq(salons.id, requestedSalonId)
        });
        if (userSalon && userSalon.ownerId === userId) {
          salonIdForQuery = requestedSalonId;
        } else {
          const userStaff = await db.query.staff.findFirst({
            where: and(eq(staff.userId, userId), eq(staff.salonId, requestedSalonId))
          });
          if (userStaff) {
            salonIdForQuery = requestedSalonId;
          }
        }
      } else {
        const userStaff = await db.query.staff.findFirst({
          where: eq(staff.userId, userId)
        });

        if (userStaff) {
          salonIdForQuery = userStaff.salonId;
        } else {
          const userSalon = await db.query.salons.findFirst({
            where: eq(salons.ownerId, userId)
          });
          if (userSalon) {
            salonIdForQuery = userSalon.id;
          }
        }
      }

      if (!salonIdForQuery) {
        return res.json({ conversations: [] });
      }

      conversations = await db.query.chatConversations.findMany({
        where: and(
          eq(chatConversations.salonId, salonIdForQuery),
          eq(chatConversations.status, status)
        ),
        with: {
          customer: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              profileImageUrl: true
            }
          },
          salon: {
            columns: {
              id: true,
              name: true,
              imageUrl: true
            }
          }
        },
        orderBy: [desc(chatConversations.lastMessageAt)]
      });
    } else {
      conversations = await db.query.chatConversations.findMany({
        where: and(
          eq(chatConversations.customerId, userId),
          eq(chatConversations.status, status)
        ),
        with: {
          salon: {
            columns: {
              id: true,
              name: true,
              imageUrl: true,
              phone: true
            }
          },
          assignedStaff: {
            columns: {
              id: true,
              name: true,
              photoUrl: true
            }
          }
        },
        orderBy: [desc(chatConversations.lastMessageAt)]
      });
    }

    res.json({ conversations });

  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

router.get('/conversations/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.conversationId, id),
        eq(chatParticipants.userId, userId)
      )
    });

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const conversation = await db.query.chatConversations.findFirst({
      where: eq(chatConversations.id, id),
      with: {
        salon: {
          columns: {
            id: true,
            name: true,
            imageUrl: true,
            phone: true,
            address: true
          }
        },
        customer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true
          }
        },
        assignedStaff: {
          columns: {
            id: true,
            name: true,
            photoUrl: true,
            roles: true
          }
        },
        participants: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation, participantRole: participant.role });

  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.get('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const cursor = req.query.cursor as string;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

    const conversation = await db.query.chatConversations.findFirst({
      where: eq(chatConversations.id, id)
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    let hasAccess = false;
    
    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.conversationId, id),
        eq(chatParticipants.userId, userId)
      )
    });
    if (participant) hasAccess = true;

    if (!hasAccess) {
      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, conversation.salonId)
      });
      if (salon && salon.ownerId === userId) hasAccess = true;
    }

    if (!hasAccess) {
      const userStaff = await db.query.staff.findFirst({
        where: and(eq(staff.userId, userId), eq(staff.salonId, conversation.salonId))
      });
      if (userStaff) hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let messages;
    if (cursor) {
      messages = await db.query.chatMessages.findMany({
        where: and(
          eq(chatMessages.conversationId, id),
          lt(chatMessages.sentAt, new Date(cursor))
        ),
        orderBy: [desc(chatMessages.sentAt)],
        limit: limit + 1
      });
    } else {
      messages = await db.query.chatMessages.findMany({
        where: eq(chatMessages.conversationId, id),
        orderBy: [desc(chatMessages.sentAt)],
        limit: limit + 1
      });
    }

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    messages.reverse();

    const nextCursor = hasMore && messages.length > 0 
      ? messages[0].sentAt?.toISOString() 
      : null;

    res.json({ 
      messages,
      nextCursor,
      hasMore
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

router.post('/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    
    const validation = sendMessageSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error.errors });
    }

    const conversation = await db.query.chatConversations.findFirst({
      where: eq(chatConversations.id, id)
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    let hasAccess = false;
    let senderRole: 'customer' | 'staff' = 'staff';
    
    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.conversationId, id),
        eq(chatParticipants.userId, userId)
      )
    });
    if (participant) {
      hasAccess = true;
      senderRole = participant.role as 'customer' | 'staff';
    }

    if (!hasAccess) {
      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, conversation.salonId)
      });
      if (salon && salon.ownerId === userId) {
        hasAccess = true;
        senderRole = 'staff';
      }
    }

    if (!hasAccess) {
      const userStaff = await db.query.staff.findFirst({
        where: and(eq(staff.userId, userId), eq(staff.salonId, conversation.salonId))
      });
      if (userStaff) {
        hasAccess = true;
        senderRole = 'staff';
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
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

    const { body, messageType, attachmentUrl, attachmentType, attachmentName, attachmentSize } = validation.data;

    const [message] = await db.insert(chatMessages).values({
      conversationId: id,
      senderId: userId,
      senderRole: senderRole,
      senderName,
      senderAvatar: user?.profileImageUrl,
      messageType,
      body,
      attachmentUrl,
      attachmentType,
      attachmentName,
      attachmentSize,
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
      .where(eq(chatConversations.id, id));

    res.status(201).json({ message });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

router.post('/conversations/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    const conversation = await db.query.chatConversations.findFirst({
      where: eq(chatConversations.id, id)
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    let hasAccess = false;
    let isStaff = false;
    
    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.conversationId, id),
        eq(chatParticipants.userId, userId)
      )
    });
    if (participant) {
      hasAccess = true;
      isStaff = participant.role === 'staff';
    }

    if (!hasAccess) {
      const salon = await db.query.salons.findFirst({
        where: eq(salons.id, conversation.salonId)
      });
      if (salon && salon.ownerId === userId) {
        hasAccess = true;
        isStaff = true;
      }
    }

    if (!hasAccess) {
      const userStaff = await db.query.staff.findFirst({
        where: and(eq(staff.userId, userId), eq(staff.salonId, conversation.salonId))
      });
      if (userStaff) {
        hasAccess = true;
        isStaff = true;
      }
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (participant) {
      await db.update(chatParticipants)
        .set({ lastReadAt: new Date() })
        .where(and(
          eq(chatParticipants.conversationId, id),
          eq(chatParticipants.userId, userId)
        ));
    }

    if (!isStaff) {
      await db.update(chatConversations)
        .set({ customerUnreadCount: 0 })
        .where(eq(chatConversations.id, id));
    } else {
      await db.update(chatConversations)
        .set({ staffUnreadCount: 0 })
        .where(eq(chatConversations.id, id));
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error marking as read:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

router.patch('/conversations/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'archived', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const participant = await db.query.chatParticipants.findFirst({
      where: and(
        eq(chatParticipants.conversationId, id),
        eq(chatParticipants.userId, userId)
      )
    });

    if (!participant) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await db.update(chatConversations)
      .set({ status, updatedAt: new Date() })
      .where(eq(chatConversations.id, id));

    res.json({ success: true });

  } catch (error) {
    console.error('Error updating conversation status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.get('/salon/:salonId/conversation', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { salonId } = req.params;

    const conversation = await db.query.chatConversations.findFirst({
      where: and(
        eq(chatConversations.salonId, salonId),
        eq(chatConversations.customerId, userId),
        eq(chatConversations.status, 'active')
      )
    });

    if (!conversation) {
      return res.status(404).json({ conversation: null });
    }

    const salon = await db.query.salons.findFirst({
      where: eq(salons.id, salonId),
      columns: {
        id: true,
        name: true,
        imageUrl: true
      }
    });

    res.json({
      conversation: {
        ...conversation,
        salonName: salon?.name,
        salonLogo: salon?.imageUrl,
        unreadCount: conversation.customerUnreadCount || 0
      }
    });

  } catch (error) {
    console.error('Error fetching salon conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const role = req.query.role as string;

    let totalUnread = 0;

    if (role === 'staff') {
      const userStaff = await db.query.staff.findFirst({
        where: eq(staff.userId, userId)
      });

      if (userStaff) {
        const conversations = await db.query.chatConversations.findMany({
          where: and(
            eq(chatConversations.salonId, userStaff.salonId),
            eq(chatConversations.status, 'active')
          ),
          columns: {
            staffUnreadCount: true
          }
        });

        totalUnread = conversations.reduce((sum, c) => sum + (c.staffUnreadCount || 0), 0);
      }
    } else {
      const conversations = await db.query.chatConversations.findMany({
        where: and(
          eq(chatConversations.customerId, userId),
          eq(chatConversations.status, 'active')
        ),
        columns: {
          customerUnreadCount: true
        }
      });

      totalUnread = conversations.reduce((sum, c) => sum + (c.customerUnreadCount || 0), 0);
    }

    res.json({ unreadCount: totalUnread });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

router.get('/customer-context/:customerId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { customerId } = req.params;
    const salonId = req.query.salonId as string;

    if (!salonId) {
      return res.status(400).json({ error: 'salonId is required' });
    }

    const userSalon = await db.query.salons.findFirst({
      where: eq(salons.id, salonId)
    });
    
    let hasAccess = false;
    if (userSalon && userSalon.ownerId === userId) {
      hasAccess = true;
    } else {
      const userStaff = await db.query.staff.findFirst({
        where: and(eq(staff.userId, userId), eq(staff.salonId, salonId))
      });
      if (userStaff) hasAccess = true;
    }

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const customer = await db.query.users.findFirst({
      where: eq(users.id, customerId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImageUrl: true,
        createdAt: true
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const customerBookings = await db.query.bookings.findMany({
      where: and(
        eq(bookings.userId, customerId),
        eq(bookings.salonId, salonId)
      ),
      with: {
        service: {
          columns: {
            name: true,
            priceInPaisa: true
          }
        }
      },
      orderBy: [desc(bookings.bookingDate)],
      limit: 10
    });

    const bookingData = customerBookings.map(b => ({
      id: b.id,
      date: b.bookingDate,
      status: b.status,
      services: b.service ? [{ name: b.service.name, price: Number(b.service.priceInPaisa) / 100 }] : [],
      totalAmount: b.totalAmountPaisa ? Number(b.totalAmountPaisa) / 100 : 0
    }));

    const totalBookings = customerBookings.length;
    const totalSpent = customerBookings.reduce((sum, b) => sum + (Number(b.totalAmountPaisa) / 100 || 0), 0);

    res.json({
      customer: {
        ...customer,
        createdAt: customer.createdAt?.toISOString() || null
      },
      bookings: bookingData,
      totalBookings,
      totalSpent
    });

  } catch (error) {
    console.error('Error fetching customer context:', error);
    res.status(500).json({ error: 'Failed to fetch customer context' });
  }
});

export default router;
