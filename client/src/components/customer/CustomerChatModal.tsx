import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, X, MessageCircle, Check, CheckCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'staff';
  senderName: string | null;
  senderAvatar: string | null;
  messageType: 'text' | 'image' | 'file' | 'system';
  body: string | null;
  attachmentUrl: string | null;
  sentAt: string;
  deliveredAt: string | null;
  readAt?: string | null;
  tempId?: string;
}

interface Conversation {
  id: string;
  salonId: string;
  customerId: string;
  status: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  customerUnreadCount: number;
  staffUnreadCount: number;
}

interface CustomerChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  salonId: string;
  salonName: string;
  salonImage?: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  authToken: string;
  bookingContext?: {
    bookingId: string;
    serviceName: string;
    bookingDate: string;
  };
}

export function CustomerChatModal({
  isOpen,
  onClose,
  salonId,
  salonName,
  salonImage,
  userId,
  userName,
  userAvatar,
  authToken,
  bookingContext
}: CustomerChatModalProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessagesRef = useRef<Map<string, Message>>(new Map());

  useEffect(() => {
    if (isOpen && salonId && userId && authToken) {
      initializeConversation();
    }
  }, [isOpen, salonId, userId, authToken]);

  useEffect(() => {
    if (!conversation || !userId || !authToken) return;

    const socket = io(window.location.origin, {
      path: '/socket.io',
      auth: {
        token: authToken,
        userRole: 'customer',
        salonId
      },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Chat socket connected');
      setIsConnected(true);
      socket.emit('conversation:join', conversation.id);
    });

    socket.on('disconnect', () => {
      console.log('Chat socket disconnected');
      setIsConnected(false);
    });

    socket.on('message:new', (message: Message) => {
      setMessages(prev => {
        if (message.tempId && pendingMessagesRef.current.has(message.tempId)) {
          pendingMessagesRef.current.delete(message.tempId);
          return prev.map(m => m.id === message.tempId ? { ...message, id: message.id } : m);
        }
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      scrollToBottom();
    });

    socket.on('message:ack', ({ tempId, messageId }: { tempId: string; messageId: string }) => {
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, id: messageId } : m
      ));
    });

    socket.on('typing:update', ({ userId: typingUserId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (typingUserId !== userId) {
        setOtherUserTyping(typing);
      }
    });

    socket.on('message:read', ({ userId: readerId }: { userId: string }) => {
      if (readerId !== userId) {
        setMessages(prev => prev.map(m => {
          if (m.senderId === userId && !m.readAt) {
            return { ...m, readAt: new Date().toISOString() };
          }
          return m;
        }));
      }
    });

    socketRef.current = socket;

    return () => {
      socket.emit('conversation:leave', conversation.id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversation?.id, userId, authToken, salonId]);

  useEffect(() => {
    if (conversation && messages.length > 0) {
      const hasUnreadFromOthers = messages.some(m => m.senderId !== userId && !m.deliveredAt);
      if (hasUnreadFromOthers) {
        markAsRead();
      }
    }
  }, [conversation?.id, messages.length, userId]);

  useEffect(() => {
    if (!isOpen) {
      setConversation(null);
      setMessages([]);
      setInputValue('');
      setIsLoading(false);
      setOtherUserTyping(false);
    }
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const initializeConversation = async () => {
    setIsLoading(true);
    try {
      const contextType = bookingContext ? 'support' : 'booking_inquiry';
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ 
          salonId, 
          context: contextType,
          bookingId: bookingContext?.bookingId
        })
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      
      const data = await response.json();
      setConversation(data.conversation);

      await loadMessages(data.conversation.id);
    } catch (error) {
      console.error('Error initializing conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string, cursor?: string) => {
    try {
      const url = new URL(`/api/chat/conversations/${conversationId}/messages`, window.location.origin);
      if (cursor) url.searchParams.set('cursor', cursor);
      url.searchParams.set('limit', '50');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to load messages');
      
      const data = await response.json();
      
      if (cursor) {
        setMessages(prev => [...data.messages, ...prev]);
      } else {
        setMessages(data.messages);
        scrollToBottom();
      }
      
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadMoreMessages = async () => {
    if (!conversation || loadingMore || !hasMore || messages.length === 0) return;
    
    setLoadingMore(true);
    const oldestMessage = messages[0];
    await loadMessages(conversation.id, oldestMessage.sentAt);
    setLoadingMore(false);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !conversation || !socketRef.current) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId: conversation.id,
      senderId: userId,
      senderRole: 'customer',
      senderName: userName,
      senderAvatar: userAvatar || null,
      messageType: 'text',
      body: inputValue.trim(),
      attachmentUrl: null,
      sentAt: new Date().toISOString(),
      deliveredAt: null,
      tempId
    };

    pendingMessagesRef.current.set(tempId, tempMessage);
    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');
    scrollToBottom();

    socketRef.current.emit('message:send', {
      conversationId: conversation.id,
      body: inputValue.trim(),
      messageType: 'text',
      tempId
    });

    stopTyping();
  };

  const markAsRead = async () => {
    if (!conversation) return;
    
    try {
      await fetch(`/api/chat/conversations/${conversation.id}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (!isTyping && socketRef.current && conversation) {
      setIsTyping(true);
      socketRef.current.emit('typing:start', conversation.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping && socketRef.current && conversation) {
      setIsTyping(false);
      socketRef.current.emit('typing:stop', conversation.id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';

    msgs.forEach(msg => {
      const msgDate = formatDate(msg.sentAt);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });

    return groups;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
        <DialogHeader className="flex-shrink-0 p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={salonImage} alt={salonName} />
              <AvatarFallback>{salonName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <DialogTitle className="text-white">{salonName}</DialogTitle>
              <p className="text-sm opacity-80">
                {isConnected ? (otherUserTyping ? 'Typing...' : 'Online') : 'Connecting...'}
              </p>
            </div>
          </div>
        </DialogHeader>

        {bookingContext && (
          <div className="flex-shrink-0 px-4 py-2 bg-muted/50 border-b">
            <p className="text-xs text-muted-foreground">
              Regarding: <span className="font-medium">{bookingContext.serviceName}</span> on {bookingContext.bookingDate}
            </p>
          </div>
        )}

        <ScrollArea 
          ref={scrollAreaRef}
          className="flex-1 p-4"
          onScrollCapture={(e) => {
            const target = e.target as HTMLDivElement;
            if (target.scrollTop === 0 && hasMore && !loadingMore) {
              loadMoreMessages();
            }
          }}
        >
          {loadingMore && (
            <div className="text-center py-2 text-sm text-muted-foreground">
              Loading more messages...
            </div>
          )}
          
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">Start a conversation</p>
              <p className="text-sm">Ask about services, appointments, or get help!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupMessagesByDate(messages).map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex justify-center mb-4">
                    <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                      {group.date}
                    </span>
                  </div>
                  {group.messages.map((message, messageIndex) => {
                    const isOwn = message.senderId === userId;
                    const isSystem = message.messageType === 'system';
                    
                    // Industry standard: if there's a reply from the other party after this message, it's been read
                    const isRead = isOwn && !message.id.startsWith('temp-') && (() => {
                      const messageTime = new Date(message.sentAt).getTime();
                      return messages.some(m => 
                        m.senderId !== userId && 
                        new Date(m.sentAt).getTime() > messageTime
                      );
                    })();

                    if (isSystem) {
                      return (
                        <div key={message.id} className="flex justify-center my-2">
                          <span className="text-xs text-muted-foreground italic">
                            {message.body}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex gap-2 mb-3",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        {!isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={message.senderAvatar || ''} />
                            <AvatarFallback>
                              {message.senderName?.charAt(0) || 'S'}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            "max-w-[75%] rounded-lg px-3 py-2",
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {message.senderName || 'Staff'}
                            </p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.body}
                          </p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}>
                            <span className="text-[10px] opacity-60">
                              {formatTime(message.sentAt)}
                            </span>
                            {isOwn && (
                              <span className="opacity-70">
                                {message.id.startsWith('temp-') ? (
                                  <Clock className="h-3 w-3" />
                                ) : (isRead || message.readAt) ? (
                                  <CheckCheck className="h-3 w-3 text-blue-400" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        {isOwn && (
                          <Avatar className="h-8 w-8 flex-shrink-0">
                            <AvatarImage src={userAvatar} />
                            <AvatarFallback>
                              {userName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
              
              {otherUserTyping && (
                <div className="flex gap-2 items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={salonImage} />
                    <AvatarFallback>{salonName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>

        <div className="flex-shrink-0 p-3 border-t">
          <div className="flex items-center gap-2">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
              disabled={!isConnected || isLoading}
            />
            <Button
              onClick={sendMessage}
              size="icon"
              disabled={!inputValue.trim() || !isConnected || isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CustomerChatModal;
