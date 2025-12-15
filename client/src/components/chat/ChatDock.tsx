import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, X, Minimize2, Send, ChevronLeft, Volume2, VolumeX, Check, CheckCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, isToday, isYesterday, parseISO } from 'date-fns';
import { authenticatedFetch, getAccessToken } from '@/lib/auth';

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'customer' | 'staff';
  senderName: string | null;
  senderAvatar: string | null;
  messageType: 'text' | 'image' | 'file' | 'system';
  body: string | null;
  sentAt: string;
  deliveredAt: string | null;
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
  customer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

interface ChatDockProps {
  salonId: string;
  staffId?: string;
  userId?: string;
  userName?: string;
  isMinimized?: boolean;
  onMinimize?: () => void;
  onClose?: () => void;
}

export function ChatDock({
  salonId,
  staffId,
  userId,
  userName,
  isMinimized: externalMinimized,
  onMinimize,
  onClose
}: ChatDockProps) {
  const [isMinimized, setIsMinimized] = useState(externalMinimized ?? false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [chatToken, setChatToken] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('chatSoundEnabled');
    return stored !== 'false';
  });
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const totalUnread = conversations.reduce((sum, c) => sum + c.staffUnreadCount, 0);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.5;
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    audioRef.current = audio;
  }, []);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await authenticatedFetch('/api/chat/token');
        if (response.ok) {
          const data = await response.json();
          setChatToken(data.token);
        }
      } catch (error) {
        console.error('Failed to fetch chat token:', error);
      }
    };
    fetchToken();
  }, []);

  useEffect(() => {
    if (!salonId) return;

    const fetchConversations = async () => {
      try {
        const response = await authenticatedFetch(`/api/chat/conversations?role=staff&salonId=${salonId}`);
        if (!response.ok) {
          console.error('Failed to fetch conversations:', response.status, response.statusText);
          setIsLoading(false);
          return;
        }
        const data = await response.json();
        const convs = data.conversations || [];
        setConversations(convs);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        setIsLoading(false);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 30000);
    return () => clearInterval(interval);
  }, [salonId]);

  const selectedConversationRef = useRef<Conversation | null>(null);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (!chatToken || !salonId) return;

    const socket = io(window.location.origin, {
      path: '/socket.io',
      auth: {
        token: chatToken,
        userRole: 'staff',
        salonId,
        staffId
      },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('ChatDock: Socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('ChatDock: Socket disconnected');
      setIsConnected(false);
    });

    socket.on('message:new', (message: Message) => {
      const currentConversation = selectedConversationRef.current;
      const isActiveConversation = currentConversation && message.conversationId === currentConversation.id;
      
      if (isActiveConversation) {
        setMessages(prev => {
          if (message.tempId) {
            const tempIndex = prev.findIndex(m => m.id === message.tempId || m.tempId === message.tempId);
            if (tempIndex !== -1) {
              const updated = [...prev];
              updated[tempIndex] = message;
              return updated;
            }
          }
          
          if (prev.some(m => m.id === message.id)) return prev;
          
          const duplicateByContent = prev.find(m => 
            m.id.startsWith('temp-') && 
            m.body === message.body && 
            m.senderRole === message.senderRole &&
            Math.abs(new Date(m.sentAt).getTime() - new Date(message.sentAt).getTime()) < 5000
          );
          
          if (duplicateByContent) {
            return prev.map(m => m.id === duplicateByContent.id ? message : m);
          }
          
          return [...prev, message];
        });
        
        if (message.senderRole === 'customer') {
          setCustomerTyping(false);
          authenticatedFetch(`/api/chat/conversations/${message.conversationId}/read`, {
            method: 'POST'
          }).catch(() => {});
        }
      }
      
      setConversations(prev => prev.map(c => {
        if (c.id === message.conversationId) {
          const newUnreadCount = isActiveConversation 
            ? 0 
            : (message.senderRole === 'customer' ? c.staffUnreadCount + 1 : c.staffUnreadCount);
          return {
            ...c,
            lastMessagePreview: message.body,
            lastMessageAt: message.sentAt,
            staffUnreadCount: newUnreadCount
          };
        }
        return c;
      }));

      if (message.senderRole === 'customer' && !isActiveConversation && soundEnabledRef.current && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    });

    socket.on('message:ack', ({ tempId, messageId }: { tempId: string; messageId: string }) => {
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, id: messageId } : m
      ));
    });

    socket.on('typing:update', ({ userId: typingUserId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (typingUserId !== staffId && typingUserId !== userId) {
        setCustomerTyping(typing);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [chatToken, salonId, staffId, userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await authenticatedFetch(`/api/chat/conversations/${conversationId}/messages`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const handleSelectConversation = async (conv: Conversation) => {
    if (selectedConversation && socketRef.current) {
      socketRef.current.emit('conversation:leave', selectedConversation.id);
    }
    
    setSelectedConversation(conv);
    setCustomerTyping(false);
    
    if (socketRef.current) {
      socketRef.current.emit('conversation:join', conv.id);
    }
    
    await fetchMessages(conv.id);
    
    try {
      await authenticatedFetch(`/api/chat/conversations/${conv.id}/read`, {
        method: 'POST'
      });
      setConversations(prev => prev.map(c => 
        c.id === conv.id ? { ...c, staffUnreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    if (!isTyping && socketRef.current && selectedConversation) {
      setIsTyping(true);
      socketRef.current.emit('typing:start', selectedConversation.id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const stopTyping = () => {
    if (isTyping && socketRef.current && selectedConversation) {
      setIsTyping(false);
      socketRef.current.emit('typing:stop', selectedConversation.id);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation) return;

    const messageBody = inputValue.trim();
    const tempId = `temp-${Date.now()}`;
    
    const tempMessage: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: staffId || userId || '',
      senderRole: 'staff',
      senderName: userName || 'Staff',
      senderAvatar: null,
      messageType: 'text',
      body: messageBody,
      sentAt: new Date().toISOString(),
      deliveredAt: null,
      tempId
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');
    stopTyping();

    if (socketRef.current?.connected) {
      socketRef.current.emit('message:send', {
        conversationId: selectedConversation.id,
        body: messageBody,
        messageType: 'text',
        tempId
      });
    } else {
      try {
        const response = await authenticatedFetch(`/api/chat/conversations/${selectedConversation.id}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: messageBody, messageType: 'text' })
        });

        if (response.ok) {
          const data = await response.json();
          setMessages(prev => prev.map(m => m.id === tempId ? data.message : m));
        } else {
          console.error('Failed to send message via REST');
          setInputValue(messageBody);
          setMessages(prev => prev.filter(m => m.id !== tempId));
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        setInputValue(messageBody);
        setMessages(prev => prev.filter(m => m.id !== tempId));
      }
    }
  };

  const handleBack = () => {
    if (selectedConversation && socketRef.current) {
      socketRef.current.emit('conversation:leave', selectedConversation.id);
    }
    setSelectedConversation(null);
    setMessages([]);
    setCustomerTyping(false);
  };

  const toggleMinimize = () => {
    if (onMinimize) {
      onMinimize();
    }
    setIsMinimized(!isMinimized);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentGroup: { date: string; messages: Message[] } | null = null;

    messages.forEach(message => {
      const messageDate = message.sentAt;
      const dateKey = format(parseISO(messageDate), 'yyyy-MM-dd');

      if (!currentGroup || format(parseISO(currentGroup.date), 'yyyy-MM-dd') !== dateKey) {
        currentGroup = { date: messageDate, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50 cursor-pointer"
        onClick={toggleMinimize}
      >
        <div className="relative bg-gradient-to-r from-violet-500 to-purple-600 rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:scale-105">
          <MessageCircle className="h-6 w-6 text-white" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold border-2 border-white">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 h-[480px] bg-white dark:bg-slate-900 rounded-lg shadow-2xl border flex flex-col overflow-hidden">
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white">
        <div className="flex items-center gap-2">
          {selectedConversation && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={handleBack}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <MessageCircle className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="font-semibold text-sm">
              {selectedConversation 
                ? `${selectedConversation.customer?.firstName || ''} ${selectedConversation.customer?.lastName || ''}`.trim() || 'Customer'
                : 'Messages'
              }
            </span>
            {selectedConversation && (
              <span className="text-[10px] text-white/70">
                {customerTyping ? (
                  <span className="animate-pulse">Typing...</span>
                ) : isConnected ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
          {!selectedConversation && totalUnread > 0 && (
            <Badge className="bg-white/20 text-white border-0">{totalUnread}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={() => {
              setSoundEnabled(!soundEnabled);
              localStorage.setItem('chatSoundEnabled', (!soundEnabled).toString());
            }}
            title={soundEnabled ? 'Mute' : 'Unmute'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-white hover:bg-white/20"
            onClick={toggleMinimize}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {!selectedConversation ? (
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center px-4">
              <MessageCircle className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm text-slate-500">No conversations yet</p>
              <p className="text-xs text-slate-400 mt-1">Customer messages will appear here</p>
            </div>
          ) : (
            <div className="divide-y dark:divide-slate-700">
              {conversations.map(conv => {
                const customerName = conv.customer 
                  ? `${conv.customer.firstName || ''} ${conv.customer.lastName || ''}`.trim() || 'Customer'
                  : 'Customer';
                const initials = customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

                return (
                  <button
                    key={conv.id}
                    className={cn(
                      "w-full p-3 text-left hover:bg-violet-50 dark:hover:bg-slate-800 transition-colors flex items-start gap-3",
                      conv.staffUnreadCount > 0 && "bg-violet-50/50 dark:bg-violet-900/20"
                    )}
                    onClick={() => handleSelectConversation(conv)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.customer?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-white text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {conv.staffUnreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-slate-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-sm truncate dark:text-slate-200",
                          conv.staffUnreadCount > 0 ? "font-semibold" : "text-slate-700 dark:text-slate-300"
                        )}>
                          {customerName}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-xs text-slate-400">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate mt-0.5",
                        conv.staffUnreadCount > 0 ? "text-slate-600 dark:text-slate-300 font-medium" : "text-slate-500 dark:text-slate-400"
                      )}>
                        {conv.lastMessagePreview || 'No messages'}
                      </p>
                    </div>
                    {conv.staffUnreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                        {conv.staffUnreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      ) : (
        <>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {messageGroups.map((group, groupIndex) => (
                <div key={groupIndex}>
                  <div className="flex justify-center my-2">
                    <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                      {formatDateHeader(group.date)}
                    </span>
                  </div>
                  
                  {group.messages.map(message => {
                    const isOwn = message.senderRole === 'staff';
                    const isSystem = message.messageType === 'system';

                    if (isSystem) {
                      return (
                        <div key={message.id} className="flex justify-center my-2">
                          <span className="text-[10px] text-slate-400 italic bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            {message.body}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          isOwn ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[80%] rounded-lg px-3 py-2",
                            isOwn
                              ? "bg-violet-500 text-white"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-[10px]",
                              isOwn ? "text-violet-200" : "text-slate-400"
                            )}>
                              {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              <span className="text-violet-200">
                                {message.id.startsWith('temp-') ? (
                                  <Clock className="h-3 w-3" />
                                ) : message.deliveredAt ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {customerTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={inputValue}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className="flex-1 text-sm"
                disabled={!isConnected}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || !isConnected}
                className="bg-violet-500 hover:bg-violet-600"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
