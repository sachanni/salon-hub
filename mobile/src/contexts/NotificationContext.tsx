import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { notificationService, NotificationPayload } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  expoPushToken: string | null;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  isInitialized: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = notificationService.parseNotificationData(response);
    
    switch (data.action) {
      case 'quick_book':
        if (data.salonId) {
          router.push({
            pathname: '/salon/[id]',
            params: {
              id: data.salonId,
              preselectedServiceId: data.serviceId || '',
              fromRebooking: 'true',
            },
          });
        }
        break;
      case 'view_details':
        if (data.bookingId) {
          router.push({
            pathname: '/booking-detail',
            params: { id: data.bookingId },
          });
        }
        break;
      case 'view_card':
        if (data.giftCardId) {
          router.push({
            pathname: '/gift-cards/detail',
            params: { cardId: data.giftCardId },
          });
        }
        break;
      default:
        router.push('/notifications');
    }
  }, [router]);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const count = await notificationService.getBadgeCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, []);

  useEffect(() => {
    const initializeNotifications = async () => {
      if (isAuthenticated) {
        const token = await notificationService.initialize();
        setExpoPushToken(token);
        setIsInitialized(true);
        
        notificationService.setupListeners(
          undefined,
          handleNotificationResponse
        );

        await refreshUnreadCount();
      }
    };

    initializeNotifications();

    return () => {
      notificationService.removeListeners();
    };
  }, [isAuthenticated, handleNotificationResponse, refreshUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        unreadCount,
        refreshUnreadCount,
        isInitialized,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
