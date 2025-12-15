import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { 
  MessageCircle, Search, MoreVertical, Send, Check, CheckCheck, Clock, 
  User, Calendar, Phone, Mail, History, Zap, ChevronRight, X,
  Archive, CheckCircle2, CircleDot, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, isSameDay, parseISO } from 'date-fns';

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
  context?: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  customerUnreadCount: number;
  staffUnreadCount: number;
  customer?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email?: string | null;
    phone?: string | null;
    profileImageUrl: string | null;
  };
}

interface CustomerContext {
  customer: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    phone: string | null;
    profileImageUrl: string | null;
    createdAt: string | null;
  };
  bookings: {
    id: string;
    date: string;
    status: string;
    services: { name: string; price: number }[];
    totalAmount: number;
  }[];
  totalBookings: number;
  totalSpent: number;
}

interface QuickReply {
  id: string;
  label: string;
  text: string;
  category: string;
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { id: '1', label: 'Greeting', text: 'Hello! Thank you for reaching out. How can I help you today?', category: 'General' },
  { id: '2', label: 'Availability', text: 'Let me check our availability for you. What date and time works best for you?', category: 'Booking' },
  { id: '3', label: 'Confirmation', text: 'Your appointment is confirmed! We look forward to seeing you.', category: 'Booking' },
  { id: '4', label: 'Reschedule', text: 'No problem! I can help you reschedule. What new date would you prefer?', category: 'Booking' },
  { id: '5', label: 'Price Info', text: 'I\'d be happy to share our pricing. Which service are you interested in?', category: 'Services' },
  { id: '6', label: 'Location', text: 'You can find us at our salon address. Would you like directions?', category: 'General' },
  { id: '7', label: 'Thanks', text: 'Thank you for choosing us! Please don\'t hesitate to reach out if you have any questions.', category: 'General' },
  { id: '8', label: 'Running Late', text: 'Thank you for letting us know! We\'ll adjust your appointment time accordingly.', category: 'Booking' },
];

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
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'resolved'>('all');
  const [chatToken, setChatToken] = useState<string>(authToken || '');
  const [customerContext, setCustomerContext] = useState<CustomerContext | null>(null);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const [quickReplies] = useState<QuickReply[]>(DEFAULT_QUICK_REPLIES);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  
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
      loadCustomerContext(selectedConversation.customerId);
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

  const loadCustomerContext = async (customerId: string) => {
    try {
      const response = await fetch(`/api/chat/customer-context/${customerId}?salonId=${salonId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCustomerContext(data);
      }
    } catch (error) {
      console.error('Error loading customer context:', error);
      setCustomerContext(null);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputValue.trim();
    if (!textToSend || !selectedConversation || !socketRef.current) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: userId,
      senderRole: 'staff',
      senderName: userName,
      senderAvatar: null,
      messageType: 'text',
      body: textToSend,
      sentAt: new Date().toISOString(),
      deliveredAt: null,
      tempId
    };

    pendingMessagesRef.current.set(tempId, tempMessage);
    setMessages(prev => [...prev, tempMessage]);
    setInputValue('');
    setShowQuickReplies(false);
    scrollToBottom();

    socketRef.current.emit('message:send', {
      conversationId: selectedConversation.id,
      body: textToSend,
      messageType: 'text',
      tempId
    });

    stopTyping();
  };

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'POST',
        credentials: 'include'
      });
      
      // Emit socket event to notify the customer that messages have been read
      if (socketRef.current) {
        socketRef.current.emit('message:read', { conversationId });
      }
      
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, staffUnreadCount: 0 } : c
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const updateConversationStatus = async (conversationId: string, status: string) => {
    try {
      await fetch(`/api/chat/conversations/${conversationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      });
      
      loadConversations();
      if (selectedConversation?.id === conversationId && status !== 'active') {
        setSelectedConversation(null);
      }
    } catch (error) {
      console.error('Error updating status:', error);
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

  const formatDateHeader = (dateString: string) => {
    const date = parseISO(dateString);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
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

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentGroup: { date: string; messages: Message[] } | null = null;

    messages.forEach(message => {
      const messageDate = message.sentAt;
      const dateKey = format(parseISO(messageDate), 'yyyy-MM-dd');

      if (!currentGroup || currentGroup.date !== dateKey) {
        currentGroup = { date: messageDate, messages: [] };
        groups.push(currentGroup);
      }
      currentGroup.messages.push(message);
    });

    return groups;
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery
      ? getCustomerName(conv).toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    let matchesTab = true;
    if (activeTab === 'unread') {
      matchesTab = conv.staffUnreadCount > 0;
    } else if (activeTab === 'resolved') {
      matchesTab = conv.status === 'closed' || conv.status === 'archived';
    } else {
      matchesTab = conv.status === 'active';
    }
    
    return matchesSearch && matchesTab;
  });

  const totalUnread = conversations.reduce((sum, c) => sum + c.staffUnreadCount, 0);
  const messageGroups = groupMessagesByDate(messages);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CircleDot className="h-3 w-3 text-green-500" />;
      case 'closed': return <CheckCircle2 className="h-3 w-3 text-blue-500" />;
      case 'archived': return <Archive className="h-3 w-3 text-gray-500" />;
      default: return null;
    }
  };

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

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'unread' | 'resolved')} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-2 grid grid-cols-3">
            <TabsTrigger value="all" className="text-xs">Active</TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Unread {totalUnread > 0 && `(${totalUnread})`}
            </TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs">Resolved</TabsTrigger>
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
                            <div className="flex items-center gap-1.5">
                              {getStatusIcon(conv.status)}
                              <span className={cn(
                                "font-medium truncate",
                                conv.staffUnreadCount > 0 && "font-semibold"
                              )}>
                                {getCustomerName(conv)}
                              </span>
                            </div>
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{getCustomerName(selectedConversation)}</h3>
                    <Badge variant="outline" className="text-xs">
                      {selectedConversation.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {customerTyping ? (
                      <span className="text-primary animate-pulse">Typing...</span>
                    ) : isConnected ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowContextPanel(!showContextPanel)}
                  className="text-muted-foreground"
                >
                  <User className="h-4 w-4 mr-1" />
                  {showContextPanel ? 'Hide' : 'Show'} Info
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {selectedConversation.status === 'active' && (
                      <DropdownMenuItem onClick={() => updateConversationStatus(selectedConversation.id, 'closed')}>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Resolved
                      </DropdownMenuItem>
                    )}
                    {selectedConversation.status === 'closed' && (
                      <DropdownMenuItem onClick={() => updateConversationStatus(selectedConversation.id, 'active')}>
                        <CircleDot className="h-4 w-4 mr-2" />
                        Reopen Conversation
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => updateConversationStatus(selectedConversation.id, 'archived')}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messageGroups.map((group, groupIndex) => (
                    <div key={groupIndex}>
                      <div className="flex justify-center my-4">
                        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                          {formatDateHeader(group.date)}
                        </span>
                      </div>
                      
                      {group.messages.map((message) => {
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
                    </div>
                  ))}
                  
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

              {showContextPanel && customerContext && (
                <div className="w-72 border-l bg-muted/30 overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-sm">Customer Info</h4>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6"
                        onClick={() => setShowContextPanel(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={customerContext.customer.profileImageUrl || ''} />
                          <AvatarFallback>
                            {(customerContext.customer.firstName?.[0] || '') + (customerContext.customer.lastName?.[0] || '')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {customerContext.customer.firstName} {customerContext.customer.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Customer since {customerContext.customer.createdAt 
                              ? format(new Date(customerContext.customer.createdAt), 'MMM yyyy')
                              : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-2">
                        {customerContext.customer.email && (
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{customerContext.customer.email}</span>
                          </div>
                        )}
                        {customerContext.customer.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{customerContext.customer.phone}</span>
                          </div>
                        )}
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">{customerContext.totalBookings}</p>
                          <p className="text-xs text-muted-foreground">Total Visits</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-primary">₹{customerContext.totalSpent.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">Total Spent</p>
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <History className="h-4 w-4 text-muted-foreground" />
                          <h5 className="font-medium text-sm">Recent Bookings</h5>
                        </div>
                        
                        {customerContext.bookings.length > 0 ? (
                          <div className="space-y-2">
                            {customerContext.bookings.slice(0, 5).map(booking => (
                              <div key={booking.id} className="bg-background rounded-lg p-3">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-medium">
                                    {format(new Date(booking.date), 'MMM d, yyyy')}
                                  </span>
                                  <Badge 
                                    variant={booking.status === 'completed' ? 'default' : 'secondary'}
                                    className="text-[10px] h-5"
                                  >
                                    {booking.status}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {booking.services.map(s => s.name).join(', ')}
                                </p>
                                <p className="text-xs font-medium mt-1">
                                  ₹{booking.totalAmount.toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground">No booking history</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t">
              {showQuickReplies && (
                <div className="mb-3 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Quick Replies</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6"
                      onClick={() => setShowQuickReplies(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {quickReplies.map(reply => (
                      <Button
                        key={reply.id}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 px-3"
                        onClick={() => sendMessage(reply.text)}
                      >
                        <div>
                          <p className="font-medium text-xs">{reply.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {reply.text.substring(0, 40)}...
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowQuickReplies(!showQuickReplies)}
                  className={cn(showQuickReplies && "bg-primary text-primary-foreground")}
                  title="Quick Replies"
                >
                  <Zap className="h-4 w-4" />
                </Button>
                <Input
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1"
                  disabled={!isConnected}
                />
                <Button
                  onClick={() => sendMessage()}
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
