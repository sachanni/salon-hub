import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Search, MoreVertical, Send, Check, CheckCheck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface ChatInboxProps {
  salonId: string;
  staffId: string;
  userId: string;
  userName: string;
  authToken: string;
}

export function ChatInbox({
  salonId,
  staffId,
  userId,
  userName,
  authToken
}: ChatInboxProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [customerTyping, setCustomerTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [chatToken, setChatToken] = useState<string>(authToken || '');
  
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingMessagesRef = useRef<Map<string, Message>>(new Map());

  useEffect(() => {
    const fetchToken = async () => {
      if (!authToken) {
        try {
          const response = await fetch('/api/chat/token', {
            credentials: 'include'
          });
          if (response.ok) {
            const data = await response.json();
            setChatToken(data.token);
          }
        } catch (error) {
          console.error('Failed to fetch chat token:', error);
        }
      }
    };
    fetchToken();
  }, [authToken]);

  useEffect(() => {
    if (!chatToken) return;
    
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
      console.log('Staff chat socket connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Staff chat socket disconnected');
      setIsConnected(false);
    });

    socket.on('message:new', (message: Message) => {
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        setMessages(prev => {
          if (message.tempId && pendingMessagesRef.current.has(message.tempId)) {
            pendingMessagesRef.current.delete(message.tempId);
            return prev.map(m => m.id === message.tempId ? { ...message, id: message.id } : m);
          }
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
        
        if (message.senderId !== userId) {
          markAsRead(selectedConversation.id);
        }
      }
      
      loadConversations();
    });

    socket.on('message:ack', ({ tempId, messageId }: { tempId: string; messageId: string }) => {
      setMessages(prev => prev.map(m => 
        m.id === tempId ? { ...m, id: messageId } : m
      ));
    });

    socket.on('typing:update', ({ userId: typingUserId, isTyping: typing }: { userId: string; isTyping: boolean }) => {
      if (typingUserId !== userId) {
        setCustomerTyping(typing);
      }
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, salonId, staffId, chatToken]);

  useEffect(() => {
    if (chatToken) {
      loadConversations();
    }
  }, [chatToken]);

  useEffect(() => {
    if (selectedConversation && socketRef.current) {
      socketRef.current.emit('conversation:join', selectedConversation.id);
      loadMessages(selectedConversation.id);
      markAsRead(selectedConversation.id);
    }
    return () => {
      if (selectedConversation && socketRef.current) {
        socketRef.current.emit('conversation:leave', selectedConversation.id);
      }
    };
  }, [selectedConversation?.id]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const loadConversations = async () => {
    try {
      const response = await fetch(`/api/chat/conversations?role=staff&salonId=${salonId}`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to load conversations');
      
      const data = await response.json();
      setConversations(data.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to load messages');
      
      const data = await response.json();
      setMessages(data.messages);
      scrollToBottom();
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation || !socketRef.current) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: userId,
      senderRole: 'staff',
      senderName: userName,
      senderAvatar: null,
      messageType: 'text',
      body: inputValue.trim(),
      sentAt: new Date().toISOString(),
      deliveredAt: null,
      tempId
    };

    pendingMessagesRef.current.set(tempId, tempMessage);
    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');
    scrollToBottom();

    socketRef.current.emit('message:send', {
      conversationId: selectedConversation.id,
      body: inputValue.trim(),
      messageType: 'text',
      tempId
    });

    stopTyping();
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, staffUnreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
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

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getCustomerName = (conv: Conversation) => {
    if (conv.customer) {
      const firstName = conv.customer.firstName || '';
      const lastName = conv.customer.lastName || '';
      return `${firstName} ${lastName}`.trim() || 'Customer';
    }
    return 'Customer';
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery
      ? getCustomerName(conv).toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    const matchesTab = activeTab === 'unread' 
      ? conv.staffUnreadCount > 0 
      : true;
    return matchesSearch && matchesTab;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.staffUnreadCount, 0);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] border rounded-lg overflow-hidden bg-background">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Messages</h2>
            {totalUnread > 0 && (
              <Badge variant="destructive">{totalUnread}</Badge>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread')} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2">
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
            <TabsTrigger value="unread" className="flex-1">
              Unread {totalUnread > 0 && `(${totalUnread})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="flex-1 m-0">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                  <p className="text-sm">No conversations</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={cn(
                        "w-full p-4 text-left hover:bg-muted/50 transition-colors",
                        selectedConversation?.id === conv.id && "bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conv.customer?.profileImageUrl || ''} />
                          <AvatarFallback>
                            {getCustomerName(conv).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className={cn(
                              "font-medium truncate",
                              conv.staffUnreadCount > 0 && "font-semibold"
                            )}>
                              {getCustomerName(conv)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className={cn(
                              "text-sm truncate max-w-[180px]",
                              conv.staffUnreadCount > 0 
                                ? "text-foreground font-medium" 
                                : "text-muted-foreground"
                            )}>
                              {conv.lastMessagePreview || 'No messages yet'}
                            </p>
                            {conv.staffUnreadCount > 0 && (
                              <Badge variant="default" className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                                {conv.staffUnreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedConversation.customer?.profileImageUrl || ''} />
                  <AvatarFallback>
                    {getCustomerName(selectedConversation).charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{getCustomerName(selectedConversation)}</h3>
                  <p className="text-sm text-muted-foreground">
                    {customerTyping ? 'Typing...' : isConnected ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwn = message.senderId === userId;
                  const isSystem = message.messageType === 'system';

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center my-2">
                        <span className="text-xs text-muted-foreground italic bg-muted px-3 py-1 rounded-full">
                          {message.body}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-2",
                        isOwn ? "justify-end" : "justify-start"
                      )}
                    >
                      {!isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={message.senderAvatar || ''} />
                          <AvatarFallback>
                            {message.senderName?.charAt(0) || 'C'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg px-4 py-2",
                          isOwn
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        )}
                      >
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
                            <span className="opacity-60">
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
                
                {customerTyping && (
                  <div className="flex gap-2 items-center">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={selectedConversation.customer?.profileImageUrl || ''} />
                      <AvatarFallback>
                        {getCustomerName(selectedConversation).charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-4 py-2">
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
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button
                  onClick={sendMessage}
                  size="icon"
                  disabled={!inputValue.trim() || !isConnected}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <MessageCircle className="h-16 w-16 mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
            <p className="text-sm">Choose a conversation from the list to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatInbox;
