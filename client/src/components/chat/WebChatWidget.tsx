import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatWidget } from './ChatWidget';
import { useAuth } from '@/contexts/AuthContext';

interface WebChatWidgetProps {
  salonId: string;
  salonName: string;
  salonImage?: string;
}

interface ChatTokenResponse {
  token: string;
  expiresIn: number;
  userId: string;
  userName: string;
  userAvatar?: string;
}

export function WebChatWidget({ salonId, salonName, salonImage }: WebChatWidgetProps) {
  const { user, isAuthenticated, login } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: chatToken, isLoading, error, refetch } = useQuery<ChatTokenResponse>({
    queryKey: ['chat-token'],
    queryFn: async () => {
      const response = await fetch('/api/chat/token', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in to chat');
        }
        throw new Error('Failed to get chat token');
      }
      
      return response.json();
    },
    enabled: isAuthenticated && isOpen,
    staleTime: 10 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: false
  });

  const handleRefreshToken = useCallback(async () => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    if (error && isOpen) {
      console.error('Chat token error:', error);
    }
  }, [error, isOpen]);

  const handleToggle = () => {
    if (!isAuthenticated) {
      login();
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-8 right-8 z-[9999] group">
        <Button
          onClick={handleToggle}
          className="flex items-center gap-2 h-12 px-5 rounded-full shadow-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium transition-all duration-300 hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">{isAuthenticated ? "Chat with us" : "Login to Chat"}</span>
        </Button>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-8 right-8 z-[9999] group">
        <Button
          onClick={login}
          className="flex items-center gap-2 h-12 px-5 rounded-full shadow-xl bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-medium transition-all duration-300 hover:scale-105"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Login to Chat</span>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-8 right-8 w-96 h-[500px] bg-background border rounded-lg shadow-2xl flex items-center justify-center z-[9999]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (error || !chatToken) {
    return (
      <div className="fixed bottom-8 right-8 w-96 bg-background border rounded-lg shadow-2xl z-[9999]">
        <div className="p-4 flex flex-col items-center gap-3">
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : 'Failed to connect to chat'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClose}>
              Close
            </Button>
            <Button size="sm" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ChatWidget
      salonId={salonId}
      salonName={salonName}
      salonImage={salonImage}
      userId={chatToken.userId}
      userName={chatToken.userName}
      userAvatar={chatToken.userAvatar}
      authToken={chatToken.token}
      isOpen={isOpen}
      onClose={handleClose}
      onToggle={handleToggle}
    />
  );
}

export default WebChatWidget;
