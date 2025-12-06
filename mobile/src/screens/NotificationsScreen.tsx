import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { notificationAPI } from '../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  referenceId?: string;
  referenceType?: string;
  isRead: boolean;
  readAt?: string;
  imageUrl?: string;
  actionUrl?: string;
  createdAt: string;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationAPI.getNotifications({ limit: 50 });
      if (response.success) {
        setNotifications(response.notifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    Alert.alert(
      'Delete Notification',
      'Are you sure you want to delete this notification?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationAPI.deleteNotification(notificationId);
              setNotifications(prev => prev.filter(n => n.id !== notificationId));
            } catch (error) {
              console.error('Error deleting notification:', error);
            }
          },
        },
      ]
    );
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.referenceType === 'booking' && notification.referenceId) {
      router.push(`/booking-detail?id=${notification.referenceId}` as any);
    } else if (notification.referenceType === 'order' && notification.referenceId) {
      router.push(`/payment-detail?id=${notification.referenceId}` as any);
    } else if (notification.actionUrl) {
      router.push(notification.actionUrl as any);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking': return 'calendar-outline';
      case 'payment': return 'card-outline';
      case 'wallet': return 'wallet-outline';
      case 'promo': return 'gift-outline';
      case 'system': return 'information-circle-outline';
      default: return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'booking': return '#3B82F6';
      case 'payment': return '#10B981';
      case 'wallet': return '#8B5CF6';
      case 'promo': return '#F59E0B';
      case 'system': return '#6B7280';
      default: return '#8B5CF6';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllButton}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 40 }} />}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No Notifications</Text>
            <Text style={styles.emptyStateText}>
              You're all caught up! New notifications will appear here.
            </Text>
          </View>
        ) : (
          notifications.map((notification) => {
            const iconColor = getNotificationColor(notification.type);
            return (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}
                onPress={() => handleNotificationPress(notification)}
                onLongPress={() => handleDelete(notification.id)}
              >
                <View style={[styles.iconContainer, { backgroundColor: iconColor + '15' }]}>
                  <Ionicons
                    name={getNotificationIcon(notification.type) as any}
                    size={24}
                    color={iconColor}
                  />
                </View>
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <Text style={[styles.notificationTitle, !notification.isRead && styles.unreadTitle]}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationTime}>{formatTime(notification.createdAt)}</Text>
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                </View>
                {!notification.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  unreadCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#DDD6FE',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  notificationMessage: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8B5CF6',
    marginLeft: 8,
    alignSelf: 'center',
  },
});
