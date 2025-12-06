import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
  useRef,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { chatService } from '../services/chatService';
import { useAuth } from './AuthContext';
import {
  ChatMessage,
  ChatConversation,
  ChatState,
  TypingIndicator,
  StartConversationParams,
  SendMessageParams,
} from '../types/chat';

interface ChatContextType extends ChatState {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string, loadMore?: boolean) => Promise<void>;
  startConversation: (params: StartConversationParams) => Promise<ChatConversation>;
  sendMessage: (params: SendMessageParams) => Promise<ChatMessage>;
  setActiveConversation: (conversation: ChatConversation | null) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
  markAsRead: (conversationId: string, messageId: string) => void;
  refreshUnreadCount: () => Promise<void>;
}

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  messages: {},
  unreadTotal: 0,
  isConnected: false,
  isConnecting: false,
  typingUsers: {},
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [state, setState] = useState<ChatState>(initialState);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const activeConversationRef = useRef<string | null>(null);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      console.log('[ChatContext] Not authenticated, skipping connection');
      return false;
    }

    setState((prev) => ({ ...prev, isConnecting: true }));

    try {
      const connected = await chatService.connect();
      setState((prev) => ({
        ...prev,
        isConnected: connected,
        isConnecting: false,
      }));
      return connected;
    } catch (error) {
      console.error('[ChatContext] Connection error:', error);
      setState((prev) => ({ ...prev, isConnecting: false }));
      return false;
    }
  }, [isAuthenticated]);

  const disconnect = useCallback(() => {
    chatService.disconnect();
    setState((prev) => ({ ...prev, isConnected: false }));
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const conversations = await chatService.getConversations();
      setState((prev) => ({ ...prev, conversations }));
    } catch (error) {
      console.error('[ChatContext] Error loading conversations:', error);
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, loadMore = false) => {
      try {
        const existingMessages = state.messages[conversationId] || [];
        const before = loadMore && existingMessages.length > 0
          ? existingMessages[0].id
          : undefined;

        const messages = await chatService.getMessages(conversationId, {
          limit: 50,
          before,
        });

        setState((prev) => ({
          ...prev,
          messages: {
            ...prev.messages,
            [conversationId]: loadMore
              ? [...messages.reverse(), ...existingMessages]
              : messages.reverse(),
          },
        }));
      } catch (error) {
        console.error('[ChatContext] Error loading messages:', error);
      }
    },
    [state.messages]
  );

  const startConversation = useCallback(
    async (params: StartConversationParams): Promise<ChatConversation> => {
      const conversation = await chatService.startConversation(params);
      
      setState((prev) => {
        const exists = prev.conversations.some((c) => c.id === conversation.id);
        if (!exists) {
          return {
            ...prev,
            conversations: [conversation, ...prev.conversations],
          };
        }
        return prev;
      });

      chatService.joinConversation(conversation.id);
      return conversation;
    },
    []
  );

  const sendMessage = useCallback(
    async (params: SendMessageParams): Promise<ChatMessage> => {
      const message = await chatService.sendMessage(params);

      setState((prev) => ({
        ...prev,
        messages: {
          ...prev.messages,
          [params.conversationId]: [
            ...(prev.messages[params.conversationId] || []),
            message,
          ],
        },
        conversations: prev.conversations.map((conv) =>
          conv.id === params.conversationId
            ? {
                ...conv,
                lastMessage: params.body,
                lastMessageAt: message.sentAt,
                lastMessageBy: user?.id,
              }
            : conv
        ),
      }));

      return message;
    },
    [user?.id]
  );

  const setActiveConversation = useCallback(
    (conversation: ChatConversation | null) => {
      if (activeConversationRef.current && !conversation) {
        chatService.leaveConversation(activeConversationRef.current);
      }

      if (conversation) {
        chatService.joinConversation(conversation.id);
        activeConversationRef.current = conversation.id;
      } else {
        activeConversationRef.current = null;
      }

      setState((prev) => ({ ...prev, activeConversation: conversation }));
    },
    []
  );

  const sendTypingStart = useCallback((conversationId: string) => {
    chatService.sendTypingStart(conversationId);
  }, []);

  const sendTypingStop = useCallback((conversationId: string) => {
    chatService.sendTypingStop(conversationId);
  }, []);

  const markAsRead = useCallback((conversationId: string, messageId: string) => {
    chatService.markAsRead(conversationId, messageId);
    
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ),
    }));
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await chatService.getUnreadCount();
      setState((prev) => ({ ...prev, unreadTotal: count }));
    } catch (error) {
      console.error('[ChatContext] Error refreshing unread count:', error);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnect();
      setState(initialState);
      return;
    }

    connect().then((connected) => {
      if (connected) {
        loadConversations();
        refreshUnreadCount();
      }
    });

    return () => {
      disconnect();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubscribeNewMessage = chatService.on(
      'message:new',
      (message: ChatMessage) => {
        setState((prev) => {
          const conversationMessages = prev.messages[message.conversationId] || [];
          const messageExists = conversationMessages.some((m) => m.id === message.id);
          
          if (messageExists) return prev;

          const isFromCurrentUser = message.senderId === user?.id;
          
          return {
            ...prev,
            messages: {
              ...prev.messages,
              [message.conversationId]: [...conversationMessages, message],
            },
            conversations: prev.conversations.map((conv) =>
              conv.id === message.conversationId
                ? {
                    ...conv,
                    lastMessage: message.body,
                    lastMessageAt: message.sentAt,
                    lastMessageBy: message.senderId,
                    unreadCount: isFromCurrentUser
                      ? conv.unreadCount
                      : conv.unreadCount + 1,
                  }
                : conv
            ),
            unreadTotal: isFromCurrentUser
              ? prev.unreadTotal
              : prev.unreadTotal + 1,
          };
        });
      }
    );

    const unsubscribeTypingStart = chatService.on(
      'typing:start',
      (data: TypingIndicator) => {
        if (data.userId === user?.id) return;
        
        setState((prev) => ({
          ...prev,
          typingUsers: {
            ...prev.typingUsers,
            [data.conversationId]: [
              ...(prev.typingUsers[data.conversationId] || []).filter(
                (t) => t.userId !== data.userId
              ),
              data,
            ],
          },
        }));
      }
    );

    const unsubscribeTypingStop = chatService.on(
      'typing:stop',
      (data: TypingIndicator) => {
        setState((prev) => ({
          ...prev,
          typingUsers: {
            ...prev.typingUsers,
            [data.conversationId]: (
              prev.typingUsers[data.conversationId] || []
            ).filter((t) => t.userId !== data.userId),
          },
        }));
      }
    );

    const unsubscribeConnectionStatus = chatService.on(
      'connection:status',
      ({ connected }: { connected: boolean }) => {
        setState((prev) => ({ ...prev, isConnected: connected }));
      }
    );

    const unsubscribeConversationUpdated = chatService.on(
      'conversation:updated',
      (conversation: ChatConversation) => {
        setState((prev) => ({
          ...prev,
          conversations: prev.conversations.map((conv) =>
            conv.id === conversation.id ? conversation : conv
          ),
        }));
      }
    );

    return () => {
      unsubscribeNewMessage();
      unsubscribeTypingStart();
      unsubscribeTypingStop();
      unsubscribeConnectionStatus();
      unsubscribeConversationUpdated();
    };
  }, [user?.id]);

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          if (isAuthenticated && !chatService.isConnected()) {
            connect();
          }
        }
        appStateRef.current = nextAppState;
      }
    );

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, connect]);

  const contextValue = useMemo<ChatContextType>(
    () => ({
      ...state,
      connect,
      disconnect,
      loadConversations,
      loadMessages,
      startConversation,
      sendMessage,
      setActiveConversation,
      sendTypingStart,
      sendTypingStop,
      markAsRead,
      refreshUnreadCount,
    }),
    [
      state,
      connect,
      disconnect,
      loadConversations,
      loadMessages,
      startConversation,
      sendMessage,
      setActiveConversation,
      sendTypingStart,
      sendTypingStop,
      markAsRead,
      refreshUnreadCount,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
