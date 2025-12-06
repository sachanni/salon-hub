export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'salon' | 'staff';
  senderName?: string;
  senderAvatar?: string;
  messageType: 'text' | 'image' | 'file' | 'service_inquiry';
  body: string;
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  attachmentSize?: number;
  metadata?: Record<string, any>;
  isEdited?: boolean;
  editedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  sentAt: string;
  deliveredAt?: string;
  readAt?: string;
}

export interface ChatConversation {
  id: string;
  salonId: string;
  salonName?: string;
  salonLogo?: string;
  customerId: string;
  customerName?: string;
  customerAvatar?: string;
  status: 'active' | 'archived' | 'closed';
  lastMessage?: string;
  lastMessageAt?: string;
  lastMessageBy?: string;
  unreadCount: number;
  relatedBookingId?: string;
  relatedServiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'customer' | 'salon' | 'staff';
  staffId?: string;
  joinedAt: string;
  lastReadAt?: string;
  isActive: boolean;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface ChatState {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  messages: Record<string, ChatMessage[]>;
  unreadTotal: number;
  isConnected: boolean;
  isConnecting: boolean;
  typingUsers: Record<string, TypingIndicator[]>;
}

export interface StartConversationParams {
  salonId: string;
  initialMessage?: string;
  relatedServiceId?: string;
  relatedBookingId?: string;
}

export interface SendMessageParams {
  conversationId: string;
  body: string;
  messageType?: 'text' | 'image' | 'file' | 'service_inquiry';
  attachmentUrl?: string;
  attachmentType?: string;
  attachmentName?: string;
  attachmentSize?: number;
  metadata?: Record<string, any>;
}
