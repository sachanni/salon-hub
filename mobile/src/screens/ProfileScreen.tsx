import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userAPI, bookingAPI, shopAPI, notificationAPI } from '../services/api';
import { ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  memberSince: string;
}

interface UserStats {
  upcomingBookings: number;
  totalBookings: number;
  totalSpent: number;
  favoriteService: string;
  favoriteServiceCount: number;
}

interface UserPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  promotionalEmails: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState(params.tab as string || 'profile');
  const [userData, setUserData] = useState<UserData>({
    firstName: 'Guest',
    lastName: 'User',
    email: '',
    phone: '',
    memberSince: 'Nov 2025',
  });
  const [stats, setStats] = useState<UserStats>({
    upcomingBookings: 0,
    totalBookings: 0,
    totalSpent: 0,
    favoriteService: 'None',
    favoriteServiceCount: 0,
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    promotionalEmails: false,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    loadUserData();
    loadPreferences();
    loadUserStats();
    loadUnreadCount();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadUnreadCount();
      loadUserData();
    }, [])
  );

  useEffect(() => {
    if (params.tab) {
      setActiveTab(params.tab as string);
    }
  }, [params.tab]);

  useEffect(() => {
    if (activeTab === 'history') {
      loadBookingHistory();
    } else if (activeTab === 'payments') {
      loadPaymentHistory();
    }
  }, [activeTab]);

  const loadUserData = async () => {
    try {
      const authData = await AsyncStorage.getItem('authData');
      if (authData) {
        const parsed = JSON.parse(authData);
        setUserData({
          firstName: parsed.user?.firstName || 'Guest',
          lastName: parsed.user?.lastName || 'User',
          email: parsed.user?.email || '',
          phone: parsed.user?.phoneNumber || '',
          memberSince: 'Nov 2025',
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem('userPreferences');
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadUserStats = async () => {
    try {
      setIsLoadingStats(true);
      const response = await userAPI.getUserStats();
      if (response.success && response.stats) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const loadBookingHistory = async () => {
    try {
      setIsLoadingBookings(true);
      const response = await bookingAPI.getUserBookings({ limit: 50 });
      if (response.success && response.bookings) {
        setBookings(response.bookings);
      }
    } catch (error) {
      console.error('Error loading booking history:', error);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: '#ECFDF5', text: '#10B981', border: '#10B981' };
      case 'pending':
        return { bg: '#FFF7ED', text: '#F59E0B', border: '#F59E0B' };
      case 'completed':
        return { bg: '#EFF6FF', text: '#3B82F6', border: '#3B82F6' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#EF4444', border: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#6B7280' };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const loadPaymentHistory = async () => {
    try {
      setIsLoadingOrders(true);
      const response = await shopAPI.getOrders();
      if (response.success && response.orders) {
        setOrders(response.orders);
      }
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      if (response.success) {
        setUnreadNotifications(response.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return { bg: '#ECFDF5', text: '#10B981', border: '#10B981' };
      case 'pending':
      case 'processing':
        return { bg: '#FFF7ED', text: '#F59E0B', border: '#F59E0B' };
      case 'shipped':
        return { bg: '#EFF6FF', text: '#3B82F6', border: '#3B82F6' };
      case 'cancelled':
        return { bg: '#FEF2F2', text: '#EF4444', border: '#EF4444' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', border: '#6B7280' };
    }
  };

  const savePreferences = async (newPreferences: UserPreferences) => {
    try {
      await AsyncStorage.setItem('userPreferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  };

  const getInitials = () => {
    return `${userData.firstName.charAt(0)}${userData.lastName.charAt(0)}`.toUpperCase();
  };

  const togglePreference = (key: keyof UserPreferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
    savePreferences(newPreferences);
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    subtitle: string,
    icon: string,
    color: string,
    bgColor: string
  ) => (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={styles.statHeader}>
        <Text style={[styles.statTitle, { color }]}>{title}</Text>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statSubtitle, { color }]}>{subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{userData.firstName} {userData.lastName}!</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications' as any)}>
          <Ionicons name="notifications-outline" size={24} color="#6B7280" />
          {unreadNotifications > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotifications > 99 ? '99+' : unreadNotifications}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {renderStatCard(
            'UPCOMING',
            stats.upcomingBookings,
            'Next: None',
            'calendar-outline',
            '#3B82F6',
            '#EFF6FF'
          )}
          {renderStatCard(
            'BOOKINGS',
            stats.totalBookings,
            'Lifetime total',
            'book-outline',
            '#10B981',
            '#ECFDF5'
          )}
          {renderStatCard(
            'SPENT',
            `₹${(stats.totalSpent / 100).toLocaleString()}`,
            'Great customer!',
            'card-outline',
            '#8B5CF6',
            '#F5F3FF'
          )}
          {renderStatCard(
            'FAVORITE',
            stats.favoriteService,
            `${stats.favoriteServiceCount} bookings`,
            'star-outline',
            '#EC4899',
            '#FDF2F8'
          )}
        </View>

        {/* Navigation Tabs */}
        <View style={styles.tabs}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
              onPress={() => setActiveTab('profile')}
            >
              <Ionicons
                name="person-outline"
                size={14}
                color={activeTab === 'profile' ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[styles.tabText, activeTab === 'profile' && styles.tabTextActive]}>
                Profile
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'history' && styles.tabActive]}
              onPress={() => setActiveTab('history')}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={activeTab === 'history' ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                History
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'payments' && styles.tabActive]}
              onPress={() => setActiveTab('payments')}
            >
              <Ionicons
                name="card-outline"
                size={14}
                color={activeTab === 'payments' ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[styles.tabText, activeTab === 'payments' && styles.tabTextActive]}>
                Payments
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'settings' && styles.tabActive]}
              onPress={() => setActiveTab('settings')}
            >
              <Ionicons
                name="settings-outline"
                size={14}
                color={activeTab === 'settings' ? '#FFFFFF' : '#6B7280'}
              />
              <Text style={[styles.tabText, activeTab === 'settings' && styles.tabTextActive]}>
                Settings
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Profile Summary */}
        <View style={styles.profileSummary}>
          <View style={styles.profileAvatarContainer}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>{getInitials()}</Text>
            </View>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.firstName} {userData.lastName}</Text>
            <Text style={styles.profileEmail}>{userData.email}</Text>
            <View style={styles.memberBadge}>
              <Text style={styles.memberBadgeText}>Member since {userData.memberSince}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.editButton} onPress={() => router.push('/edit-profile' as any)}>
            <Ionicons name="create-outline" size={20} color="#8B5CF6" />
          </TouchableOpacity>
        </View>

        {/* Tab Content - Show appropriate section based on active tab */}
        {activeTab === 'profile' && (
          <>
            {/* Personal Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="id-card-outline" size={18} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Personal Information</Text>
              </View>
              <View style={styles.formCard}>
                <View style={styles.formRow}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>FIRST NAME</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={userData.firstName}
                      editable={false}
                    />
                  </View>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>LAST NAME</Text>
                    <TextInput
                      style={styles.fieldInput}
                      value={userData.lastName}
                      editable={false}
                    />
                  </View>
                </View>
                <View style={styles.formFieldFull}>
                  <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={userData.phone}
                    editable={false}
                  />
                </View>
                <View style={styles.formFieldFull}>
                  <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
                  <View style={styles.emailFieldContainer}>
                    <TextInput
                      style={[styles.fieldInput, styles.emailInput]}
                      value={userData.email}
                      editable={false}
                    />
                    <Ionicons name="lock-closed" size={12} color="#D1D5DB" style={styles.lockIcon} />
                  </View>
                  <Text style={styles.fieldHint}>
                    Email cannot be changed as it's used for authentication.
                  </Text>
                </View>
              </View>
            </View>

            {/* Preferences */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="notifications-outline" size={18} color="#EC4899" />
                <Text style={styles.sectionTitle}>Preferences</Text>
              </View>
              <View style={styles.preferencesCard}>
                <View style={styles.preferenceItem}>
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceTitle}>Email Notifications</Text>
                    <Text style={styles.preferenceSubtitle}>Booking confirmations & reminders</Text>
                  </View>
                  <Switch
                    value={preferences.emailNotifications}
                    onValueChange={() => togglePreference('emailNotifications')}
                    trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={[styles.preferenceItem, styles.preferenceItemBorder]}>
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceTitle}>SMS Notifications</Text>
                    <Text style={styles.preferenceSubtitle}>Urgent updates via text</Text>
                  </View>
                  <Switch
                    value={preferences.smsNotifications}
                    onValueChange={() => togglePreference('smsNotifications')}
                    trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={[styles.preferenceItem, styles.preferenceItemBorder]}>
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceTitle}>Push Notifications</Text>
                    <Text style={styles.preferenceSubtitle}>Real-time app alerts</Text>
                  </View>
                  <Switch
                    value={preferences.pushNotifications}
                    onValueChange={() => togglePreference('pushNotifications')}
                    trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
                <View style={[styles.preferenceItem, styles.preferenceItemBorder]}>
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceTitle}>Promotional Emails</Text>
                    <Text style={styles.preferenceSubtitle}>Special offers & deals</Text>
                  </View>
                  <Switch
                    value={preferences.promotionalEmails}
                    onValueChange={() => togglePreference('promotionalEmails')}
                    trackColor={{ false: '#D1D5DB', true: '#8B5CF6' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'history' && (
          <View style={styles.section}>
            {isLoadingBookings ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Loading bookings...</Text>
              </View>
            ) : bookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No Booking History</Text>
                <Text style={styles.emptyStateText}>
                  Your past bookings will appear here
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => router.push('/home')}
                >
                  <Text style={styles.emptyStateButtonText}>Explore Salons</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionSubtitle}>
                  {bookings.length} booking{bookings.length !== 1 ? 's' : ''} found
                </Text>
                {bookings.map((booking) => {
                  const statusColors = getStatusColor(booking.status);
                  return (
                    <TouchableOpacity
                      key={booking.id}
                      style={styles.bookingCard}
                      onPress={() => router.push(`/booking-detail?id=${booking.id}` as any)}
                    >
                      <View style={styles.bookingHeader}>
                        <View style={styles.bookingInfo}>
                          <Text style={styles.bookingTitle}>{booking.salonName || 'Salon'}</Text>
                          <Text style={styles.bookingService}>{booking.serviceName || 'Service'}</Text>
                        </View>
                        <View style={[styles.bookingStatus, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                          <Text style={[styles.bookingStatusText, { color: statusColors.text }]}>
                            {booking.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.bookingDetails}>
                        <View style={styles.bookingDetailRow}>
                          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                          <Text style={styles.bookingDetailText}>
                            {formatDate(booking.bookingDate)} at {booking.bookingTime}
                          </Text>
                        </View>
                        <View style={styles.bookingDetailRow}>
                          <Ionicons name="cash-outline" size={14} color="#6B7280" />
                          <Text style={styles.bookingDetailText}>
                            ₹{((booking.finalAmountPaisa || booking.totalAmountPaisa) / 100).toFixed(0)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.bookingFooter}>
                        <Text style={styles.viewDetailsText}>View Details</Text>
                        <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.section}>
            {isLoadingOrders ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8B5CF6" />
                <Text style={styles.loadingText}>Loading orders...</Text>
              </View>
            ) : orders.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="card-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No Payment History</Text>
                <Text style={styles.emptyStateText}>
                  Your payment transactions will appear here
                </Text>
              </View>
            ) : (
              <View>
                <Text style={styles.sectionSubtitle}>
                  {orders.length} order{orders.length !== 1 ? 's' : ''} found
                </Text>
                {orders.map((order) => {
                  const statusColors = getPaymentStatusColor(order.status);
                  return (
                    <TouchableOpacity
                      key={order.id}
                      style={styles.bookingCard}
                      onPress={() => router.push(`/payment-detail?id=${order.id}` as any)}
                    >
                      <View style={styles.bookingHeader}>
                        <View style={styles.bookingInfo}>
                          <Text style={styles.bookingTitle}>Order #{order.orderNumber}</Text>
                          <Text style={styles.bookingService}>
                            {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                          </Text>
                        </View>
                        <View style={[styles.bookingStatus, { backgroundColor: statusColors.bg, borderColor: statusColors.border }]}>
                          <Text style={[styles.bookingStatusText, { color: statusColors.text }]}>
                            {order.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.bookingDetails}>
                        <View style={styles.bookingDetailRow}>
                          <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                          <Text style={styles.bookingDetailText}>
                            {formatDate(order.createdAt)}
                          </Text>
                        </View>
                        <View style={styles.bookingDetailRow}>
                          <Ionicons name="cash-outline" size={14} color="#6B7280" />
                          <Text style={styles.bookingDetailText}>
                            ₹{(order.totalAmountPaisa / 100).toFixed(0)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.bookingFooter}>
                        <Text style={styles.viewDetailsText}>View Receipt</Text>
                        <Ionicons name="chevron-forward" size={16} color="#8B5CF6" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'settings' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="sparkles-outline" size={18} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Beauty Profile</Text>
            </View>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/beauty-profile' as any)}>
                <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                <Text style={styles.settingText}>My Beauty Profile</Text>
                <View style={styles.settingBadge}>
                  <Text style={styles.settingBadgeText}>NEW</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Ionicons name="gift-outline" size={18} color="#E91E63" />
              <Text style={styles.sectionTitle}>Rewards & Engagement</Text>
            </View>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/rewards' as any)}>
                <Ionicons name="star" size={20} color="#F59E0B" />
                <Text style={styles.settingText}>Rewards & Points</Text>
                <View style={styles.settingBadge}>
                  <Text style={styles.settingBadgeText}>NEW</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={() => router.push('/favorites' as any)}>
                <Ionicons name="heart" size={20} color="#EF4444" />
                <Text style={styles.settingText}>My Favorites</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={() => router.push('/referrals' as any)}>
                <Ionicons name="gift" size={20} color="#10B981" />
                <Text style={styles.settingText}>Refer & Earn</Text>
                <View style={styles.settingBadge}>
                  <Text style={styles.settingBadgeText}>NEW</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Ionicons name="wallet-outline" size={18} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Wallet & Payments</Text>
            </View>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/wallet' as any)}>
                <Ionicons name="wallet-outline" size={20} color="#8B5CF6" />
                <Text style={styles.settingText}>My Wallet</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={() => router.push('/my-memberships' as any)}>
                <Ionicons name="ribbon" size={20} color="#F59E0B" />
                <Text style={styles.settingText}>My Memberships</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={() => router.push('/notifications' as any)}>
                <Ionicons name="notifications-outline" size={20} color="#F59E0B" />
                <Text style={styles.settingText}>Notifications</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            </View>

            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Ionicons name="settings-outline" size={18} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>App Settings</Text>
            </View>
            <View style={styles.settingsCard}>
              <TouchableOpacity style={styles.settingItem} onPress={() => router.push('/language' as any)}>
                <Ionicons name="language-outline" size={20} color="#6B7280" />
                <Text style={styles.settingText}>Language</Text>
                <Text style={styles.settingValue}>English</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={() => router.push('/help-support' as any)}>
                <Ionicons name="help-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.settingText}>Help & Support</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={() => router.push({ pathname: '/web-page', params: { type: 'privacy', title: 'Privacy Policy' } } as any)}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" />
                <Text style={styles.settingText}>Privacy Policy</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={() => router.push({ pathname: '/web-page', params: { type: 'terms', title: 'Terms of Service' } } as any)}>
                <Ionicons name="document-text-outline" size={20} color="#6B7280" />
                <Text style={styles.settingText}>Terms of Service</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.settingItem, styles.settingItemBorder]} onPress={() => router.push({ pathname: '/web-page', params: { type: 'about', title: 'About Us' } } as any)}>
                <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.settingText}>About Us</Text>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            </View>
          </View>
        )}
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
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  notificationButton: {
    width: 40,
    height: 40,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    backgroundColor: '#EC4899',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    backgroundColor: '#EF4444',
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 16,
    height: 128,
    justifyContent: 'space-between',
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statSubtitle: {
    fontSize: 10,
    marginTop: 4,
  },
  tabs: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  profileSummary: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  profileAvatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2,
    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
    marginRight: 16,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  profileEmail: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 6,
  },
  memberBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  memberBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButtonDisabled: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  formField: {
    flex: 1,
  },
  formFieldFull: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  fieldInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  emailFieldContainer: {
    position: 'relative',
  },
  emailInput: {
    color: '#6B7280',
    paddingRight: 36,
  },
  lockIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  fieldHint: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  preferencesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  preferenceItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  preferenceInfo: {
    flex: 1,
  },
  preferenceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  preferenceSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  emptyStateButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  settingText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  settingBadge: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  settingBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  settingValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 16,
    fontWeight: '500',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  bookingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  bookingService: {
    fontSize: 13,
    color: '#6B7280',
  },
  bookingStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  bookingStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  bookingDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  bookingDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingDetailText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F9FAFB',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
    marginRight: 4,
  },
});
