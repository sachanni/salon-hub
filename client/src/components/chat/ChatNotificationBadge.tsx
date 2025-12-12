import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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

interface ChatNotificationBadgeProps {
  salonId: string;
  onOpenChat?: () => void;
  onSelectConversation?: (conversationId: string) => void;
}

export function ChatNotificationBadge({
  salonId,
  onOpenChat,
  onSelectConversation
}: ChatNotificationBadgeProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const stored = localStorage.getItem('chatSoundEnabled');
    return stored !== 'false';
  });
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousUnreadRef = useRef(0);

  useEffect(() => {
    const audio = new Audio();
    audio.volume = 0.5;
    audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
    audioRef.current = audio;
  }, []);

  useEffect(() => {
    if (!salonId) return;

    const fetchConversations = async () => {
      try {
        const response = await fetch(`/api/chat/conversations?role=staff&salonId=${salonId}`, {
          credentials: 'include'
        });
        if (!response.ok) {
          console.error('Failed to fetch conversations for badge:', response.status);
          return;
        }
        const data = await response.json();
        const convs = data.conversations || [];
        setConversations(convs);
        
        const newTotal = convs.reduce((sum: number, c: Conversation) => sum + c.staffUnreadCount, 0);
        
        if (newTotal > previousUnreadRef.current && previousUnreadRef.current > 0) {
          setHasNewMessage(true);
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          if (Notification.permission === 'granted') {
            const latestConv = convs.find((c: Conversation) => c.staffUnreadCount > 0);
            if (latestConv) {
              const customerName = latestConv.customer 
                ? `${latestConv.customer.firstName || ''} ${latestConv.customer.lastName || ''}`.trim() || 'Customer'
                : 'Customer';
              new Notification('New Chat Message', {
                body: `${customerName}: ${latestConv.lastMessagePreview || 'New message'}`,
                icon: '/favicon.ico',
                tag: 'chat-notification'
              });
            }
          }
          setTimeout(() => setHasNewMessage(false), 3000);
        }
        
        previousUnreadRef.current = newTotal;
        setTotalUnread(newTotal);
      } catch (error) {
        console.error('Failed to fetch conversations for badge:', error);
      }
    };

    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    
    return () => clearInterval(interval);
  }, [salonId, soundEnabled]);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('chatSoundEnabled', String(newValue));
  };

  const requestNotificationPermission = async () => {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const handleConversationClick = (conversationId: string) => {
    setIsOpen(false);
    if (onSelectConversation) {
      onSelectConversation(conversationId);
    }
  };

  const handleOpenFullChat = () => {
    setIsOpen(false);
    if (onOpenChat) {
      onOpenChat();
    }
  };

  const unreadConversations = conversations
    .filter(c => c.staffUnreadCount > 0)
    .slice(0, 5);

  const recentConversations = [...conversations]
    .sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const displayConversations = unreadConversations.length > 0 ? unreadConversations : recentConversations;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-9 w-9 rounded-full relative transition-all",
            totalUnread > 0 
              ? "hover:bg-violet-100 text-violet-600" 
              : "hover:bg-violet-100",
            hasNewMessage && "animate-pulse ring-2 ring-violet-400"
          )}
          onClick={() => requestNotificationPermission()}
        >
          <MessageCircle className={cn(
            "h-4 w-4",
            totalUnread > 0 ? "text-violet-600" : "text-slate-600"
          )} />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold shadow-lg">
              {totalUnread > 99 ? '99+' : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 shadow-xl" 
        align="end" 
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-violet-50 to-purple-50">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-violet-600" />
            <span className="font-semibold text-slate-800">Messages</span>
            {totalUnread > 0 && (
              <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                {totalUnread}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute notifications' : 'Enable sound'}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4 text-slate-500" />
            ) : (
              <VolumeX className="h-4 w-4 text-slate-400" />
            )}
          </Button>
        </div>

        <ScrollArea className="h-64">
          {displayConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-center">
              <MessageCircle className="h-10 w-10 text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">No messages yet</p>
              <p className="text-xs text-slate-400">Customer messages will appear here</p>
            </div>
          ) : (
            <div className="divide-y">
              {displayConversations.map((conv) => {
                const customerName = conv.customer 
                  ? `${conv.customer.firstName || ''} ${conv.customer.lastName || ''}`.trim() || 'Customer'
                  : 'Customer';
                const initials = customerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                
                return (
                  <button
                    key={conv.id}
                    className={cn(
                      "w-full p-3 text-left hover:bg-violet-50 transition-colors flex items-start gap-3",
                      conv.staffUnreadCount > 0 && "bg-violet-50/50"
                    )}
                    onClick={() => handleConversationClick(conv.id)}
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={conv.customer?.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-violet-400 to-purple-500 text-white text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      {conv.staffUnreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                          "text-sm truncate",
                          conv.staffUnreadCount > 0 ? "font-semibold text-slate-900" : "text-slate-700"
                        )}>
                          {customerName}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-xs text-slate-400 flex-shrink-0">
                            {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                          </span>
                        )}
                      </div>
                      <p className={cn(
                        "text-xs truncate mt-0.5",
                        conv.staffUnreadCount > 0 ? "text-slate-600 font-medium" : "text-slate-500"
                      )}>
                        {conv.lastMessagePreview || 'No messages yet'}
                      </p>
                    </div>
                    {conv.staffUnreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs flex-shrink-0">
                        {conv.staffUnreadCount}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Button
            variant="ghost"
            className="w-full justify-between text-violet-600 hover:text-violet-700 hover:bg-violet-50"
            onClick={handleOpenFullChat}
          >
            <span>View all messages</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
