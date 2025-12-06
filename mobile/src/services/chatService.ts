import { io, Socket } from 'socket.io-client';
import { secureStorage } from '../utils/secureStorage';
import { api } from './api';
import {
  ChatMessage,
  ChatConversation,
  SendMessageParams,
  StartConversationParams,
  TypingIndicator,
} from '../types/chat';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

class ChatService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Set<Function>> = new Map();

  async connect(): Promise<boolean> {
    try {
      const token = await secureStorage.getAccessToken();
      
      if (!token) {
        console.log('[ChatService] No access token available');
        return false;
      }

      if (this.socket?.connected) {
        console.log('[ChatService] Already connected');
        return true;
      }

      return new Promise((resolve) => {
        this.socket = io(API_URL, {
          path: '/socket.io',
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          timeout: 20000,
        });

        this.socket.on('connect', () => {
          console.log('[ChatService] Connected to chat server');
          this.reconnectAttempts = 0;
          this.emit('connection:status', { connected: true });
          resolve(true);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[ChatService] Disconnected:', reason);
          this.emit('connection:status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
          console.error('[ChatService] Connection error:', error.message);
          this.reconnectAttempts++;
          
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('connection:error', { error: 'Max reconnection attempts reached' });
            resolve(false);
          }
        });

        this.socket.on('message:new', (message: ChatMessage) => {
          console.log('[ChatService] New message received:', message.id);
          this.emit('message:new', message);
        });

        this.socket.on('message:delivered', ({ messageId, deliveredAt }) => {
          this.emit('message:delivered', { messageId, deliveredAt });
        });

        this.socket.on('message:read', ({ messageId, readAt, userId }) => {
          this.emit('message:read', { messageId, readAt, userId });
        });

        this.socket.on('typing:start', (data: TypingIndicator) => {
          this.emit('typing:start', data);
        });

        this.socket.on('typing:stop', (data: TypingIndicator) => {
          this.emit('typing:stop', data);
        });

        this.socket.on('presence:update', (data) => {
          this.emit('presence:update', data);
        });

        this.socket.on('conversation:updated', (conversation: ChatConversation) => {
          this.emit('conversation:updated', conversation);
        });

        setTimeout(() => {
          if (!this.socket?.connected) {
            console.log('[ChatService] Connection timeout');
            resolve(false);
          }
        }, 20000);
      });
    } catch (error) {
      console.error('[ChatService] Connect error:', error);
      return false;
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('[ChatService] Disconnected');
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  joinConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('conversation:join', { conversationId });
      console.log('[ChatService] Joined conversation:', conversationId);
    }
  }

  leaveConversation(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('conversation:leave', { conversationId });
      console.log('[ChatService] Left conversation:', conversationId);
    }
  }

  sendTypingStart(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:start', { conversationId });
    }
  }

  sendTypingStop(conversationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('typing:stop', { conversationId });
    }
  }

  markAsRead(conversationId: string, messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('message:read', { conversationId, messageId });
    }
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  async getConversations(): Promise<ChatConversation[]> {
    try {
      const response = await api.get('/api/chat/conversations');
      const conversations = response.data.conversations || [];
      
      return conversations.map((conv: any) => ({
        ...conv,
        salonName: conv.salonName || conv.salon?.name,
        salonLogo: conv.salonLogo || conv.salon?.imageUrl,
        unreadCount: conv.unreadCount ?? conv.customerUnreadCount ?? 0,
      }));
    } catch (error) {
      console.error('[ChatService] Error fetching conversations:', error);
      throw error;
    }
  }

  async getConversationById(conversationId: string): Promise<ChatConversation | null> {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}`);
      const conv = response.data.conversation;
      if (!conv) return null;
      
      return {
        ...conv,
        salonName: conv.salonName || conv.salon?.name,
        salonLogo: conv.salonLogo || conv.salon?.imageUrl,
        unreadCount: conv.unreadCount ?? conv.customerUnreadCount ?? 0,
      };
    } catch (error) {
      console.error('[ChatService] Error fetching conversation:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, params?: {
    limit?: number;
    before?: string;
  }): Promise<ChatMessage[]> {
    try {
      const response = await api.get(`/api/chat/conversations/${conversationId}/messages`, {
        params,
      });
      return response.data.messages || [];
    } catch (error) {
      console.error('[ChatService] Error fetching messages:', error);
      throw error;
    }
  }

  async startConversation(params: StartConversationParams): Promise<ChatConversation> {
    try {
      const response = await api.post('/api/chat/conversations', params);
      const conv = response.data.conversation;
      
      return {
        ...conv,
        salonName: conv.salonName || conv.salon?.name,
        salonLogo: conv.salonLogo || conv.salon?.imageUrl,
        unreadCount: conv.unreadCount ?? conv.customerUnreadCount ?? 0,
      };
    } catch (error) {
      console.error('[ChatService] Error starting conversation:', error);
      throw error;
    }
  }

  async sendMessage(params: SendMessageParams): Promise<ChatMessage> {
    try {
      const response = await api.post(`/api/chat/conversations/${params.conversationId}/messages`, {
        body: params.body,
        messageType: params.messageType || 'text',
        attachmentUrl: params.attachmentUrl,
        attachmentType: params.attachmentType,
        attachmentName: params.attachmentName,
        attachmentSize: params.attachmentSize,
        metadata: params.metadata,
      });
      return response.data.message;
    } catch (error) {
      console.error('[ChatService] Error sending message:', error);
      throw error;
    }
  }

  async getUnreadCount(): Promise<number> {
    try {
      const response = await api.get('/api/chat/unread-count');
      return response.data.unreadCount || 0;
    } catch (error) {
      console.error('[ChatService] Error fetching unread count:', error);
      return 0;
    }
  }

  async getConversationForSalon(salonId: string): Promise<ChatConversation | null> {
    try {
      const response = await api.get(`/api/chat/salon/${salonId}/conversation`);
      return response.data.conversation || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('[ChatService] Error fetching salon conversation:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
