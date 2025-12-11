import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  type: 'rebooking_reminder' | 'gift_card_received' | 'gift_card_expiry' | 'deposit_refund' | 'booking_reminder' | 'general';
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface NotificationPayload {
  salonId?: string;
  serviceId?: string;
  bookingId?: string;
  giftCardId?: string;
  action?: 'quick_book' | 'view_details' | 'view_card';
}

class NotificationService {
  private expoPushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private onNotificationReceived: ((notification: Notifications.Notification) => void) | null = null;
  private onNotificationResponse: ((response: Notifications.NotificationResponse) => void) | null = null;

  async initialize(): Promise<string | null> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission denied');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || process.env.EXPO_PUBLIC_PROJECT_ID;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      this.expoPushToken = token.data;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B5CF6',
        });

        await Notifications.setNotificationChannelAsync('rebooking', {
          name: 'Rebooking Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          description: 'Reminders for services you might want to rebook',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#8B5CF6',
        });

        await Notifications.setNotificationChannelAsync('gift_cards', {
          name: 'Gift Cards',
          importance: Notifications.AndroidImportance.DEFAULT,
          description: 'Gift card notifications and expiry reminders',
          lightColor: '#EC4899',
        });

        await Notifications.setNotificationChannelAsync('deposits', {
          name: 'Deposits & Payments',
          importance: Notifications.AndroidImportance.HIGH,
          description: 'Deposit confirmations and refund notifications',
          lightColor: '#D97706',
        });
      }

      await this.registerTokenWithServer();

      return this.expoPushToken;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return null;
    }
  }

  private async registerTokenWithServer(): Promise<void> {
    if (!this.expoPushToken) return;

    try {
      await api.post('/api/mobile/notifications/register-token', {
        token: this.expoPushToken,
        platform: Platform.OS,
        deviceId: Constants.deviceName || 'unknown',
      });
      console.log('Push token registered with server');
    } catch (error) {
      console.error('Failed to register push token:', error);
    }
  }

  setupListeners(
    onReceived?: (notification: Notifications.Notification) => void,
    onResponse?: (response: Notifications.NotificationResponse) => void
  ): void {
    this.onNotificationReceived = onReceived || null;
    this.onNotificationResponse = onResponse || null;

    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
      if (this.onNotificationReceived) {
        this.onNotificationReceived(notification);
      }
    });

    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      if (this.onNotificationResponse) {
        this.onNotificationResponse(response);
      }
    });
  }

  removeListeners(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  async scheduleLocalNotification(
    title: string,
    body: string,
    data: NotificationPayload,
    trigger: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const channelId = this.getChannelForType(data.action === 'quick_book' ? 'rebooking_reminder' : 'general');

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as any,
        sound: true,
        ...(Platform.OS === 'android' && { channelId }),
      },
      trigger,
    });
  }

  async sendImmediateLocalNotification(
    title: string,
    body: string,
    data: NotificationPayload = {}
  ): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data as any,
        sound: true,
      },
      trigger: null,
    });
  }

  private getChannelForType(type: PushNotificationData['type']): string {
    switch (type) {
      case 'rebooking_reminder':
      case 'booking_reminder':
        return 'rebooking';
      case 'gift_card_received':
      case 'gift_card_expiry':
        return 'gift_cards';
      case 'deposit_refund':
        return 'deposits';
      default:
        return 'default';
    }
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }

  parseNotificationData(response: Notifications.NotificationResponse): NotificationPayload {
    const data = response.notification.request.content.data as NotificationPayload;
    return {
      salonId: data?.salonId,
      serviceId: data?.serviceId,
      bookingId: data?.bookingId,
      giftCardId: data?.giftCardId,
      action: data?.action,
    };
  }
}

export const notificationService = new NotificationService();
export default notificationService;
