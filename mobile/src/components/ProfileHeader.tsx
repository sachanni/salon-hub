import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface ProfileHeaderProps {
  title?: string;
  showLocation?: boolean;
  location?: string;
  onLocationPress?: () => void;
  showNotificationBadge?: boolean;
  notificationCount?: number;
  rightAction?: React.ReactNode;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  title,
  showLocation = false,
  location,
  onLocationPress,
  showNotificationBadge = false,
  notificationCount = 0,
  rightAction,
}) => {
  const router = useRouter();
  const { user } = useAuth();

  const handleProfilePress = () => {
    router.push('/profile');
  };

  const handleNotificationPress = () => {
    router.push('/notifications');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <View style={styles.header}>
      <View style={styles.leftSection}>
        <TouchableOpacity 
          style={styles.profileButton} 
          onPress={handleProfilePress}
          activeOpacity={0.7}
        >
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.profilePlaceholder}>
              <Text style={styles.profileInitials}>
                {getInitials(user?.name || user?.phone || 'User')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          {title ? (
            <Text style={styles.title}>{title}</Text>
          ) : (
            <>
              <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0] || 'there'}!</Text>
              {showLocation && (
                <TouchableOpacity 
                  style={styles.locationButton} 
                  onPress={onLocationPress}
                  activeOpacity={0.7}
                >
                  <Ionicons name="location" size={14} color="#8B5CF6" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {location || 'Detecting location...'}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color="#6B7280" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>

      <View style={styles.rightSection}>
        {rightAction}
        <TouchableOpacity 
          style={styles.notificationButton} 
          onPress={handleNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons name="notifications-outline" size={24} color="#374151" />
          {showNotificationBadge && notificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {notificationCount > 99 ? '99+' : notificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileButton: {
    marginRight: 12,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#8B5CF6',
  },
  profilePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 2,
    maxWidth: 150,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
