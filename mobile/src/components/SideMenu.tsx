import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import { shopAPI } from '../services/api';

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  userName?: string;
  userEmail?: string;
}

export default function SideMenu({ visible, onClose, userName = 'Guest User', userEmail = '' }: SideMenuProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const slideAnim = React.useRef(new Animated.Value(400)).current;
  const [cartItemCount, setCartItemCount] = useState(0);

  React.useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      loadCartCount();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadCartCount = async () => {
    try {
      const cart = await shopAPI.getCart();
      const count = cart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      setCartItemCount(count);
    } catch (error) {
      console.error('Error loading cart count:', error);
      setCartItemCount(0);
    }
  };

  const getInitials = () => {
    const names = userName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
    }
    return userName.substring(0, 2).toUpperCase();
  };

  const handleNavigation = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 300);
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      setTimeout(() => {
        router.replace('/onboarding');
      }, 300);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sidebar */}
        <Animated.View
          style={[
            styles.sidebar,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#9CA3AF" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="sparkles" size={20} color="#8B5CF6" />
              <Text style={styles.logoText}>SalonHub</Text>
            </View>

            {/* User Profile Card */}
            <View style={styles.userCard}>
              <View style={styles.userAvatar}>
                <Text style={styles.userInitials}>{getInitials()}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {userName.toUpperCase()}
                </Text>
                <Text style={styles.userEmailText} numberOfLines={1}>
                  {userEmail}
                </Text>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
            {/* Section 1 */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/home')}
              >
                <Ionicons name="home-outline" size={20} color="#6B7280" style={styles.menuIcon} />
                <Text style={styles.menuText}>Home</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/shop')}
              >
                <Ionicons name="storefront-outline" size={20} color="#6B7280" style={styles.menuIcon} />
                <Text style={styles.menuText}>Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/home')}
              >
                <Ionicons name="gift-outline" size={20} color="#6B7280" style={styles.menuIcon} />
                <Text style={styles.menuText}>Offers</Text>
              </TouchableOpacity>
            </View>

            {/* Section 2 */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/profile')}
              >
                <Ionicons name="grid-outline" size={20} color="#6B7280" style={styles.menuIcon} />
                <Text style={styles.menuText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.menuItem, styles.menuItemDisabled]}
                disabled
              >
                <Ionicons name="wallet-outline" size={20} color="#D1D5DB" style={styles.menuIcon} />
                <Text style={[styles.menuText, styles.menuTextDisabled]}>Wallet</Text>
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Soon</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Section 3 */}
            <View style={styles.menuSection}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/shop/orders')}
              >
                <Ionicons name="cube-outline" size={20} color="#6B7280" style={styles.menuIcon} />
                <Text style={styles.menuText}>My Orders</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/shop/wishlist')}
              >
                <Ionicons name="heart-outline" size={20} color="#6B7280" style={styles.menuIcon} />
                <Text style={styles.menuText}>Wishlist</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => handleNavigation('/shop/cart')}
              >
                <Ionicons name="cart-outline" size={20} color="#6B7280" style={styles.menuIcon} />
                <Text style={styles.menuText}>Cart</Text>
                {cartItemCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    router.push({
                      pathname: '/profile',
                      params: { tab: 'settings' },
                    } as any);
                  }, 300);
                }}
              >
                <Ionicons name="settings-outline" size={20} color="#6B7280" style={styles.menuIcon} />
                <Text style={styles.menuText}>Settings</Text>
              </TouchableOpacity>
            </View>

            {/* Logout Section */}
            <View style={styles.menuSection}>
              <TouchableOpacity style={styles.menuItemLogout} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="#EF4444" style={styles.menuIcon} />
                <Text style={styles.menuTextLogout}>Logout</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#4B5563" />
              <Text style={styles.logoutButtonText}>Log out</Text>
            </TouchableOpacity>
            <Text style={styles.versionText}>Version 2.4.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '85%',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  userCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInitials: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  userNameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userEmailText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  menuSection: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuIcon: {
    width: 24,
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    flex: 1,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  menuTextDisabled: {
    color: '#D1D5DB',
  },
  comingSoonBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  cartBadge: {
    backgroundColor: '#F5F3FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  cartBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  menuItemLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  menuTextLogout: {
    fontSize: 15,
    fontWeight: '500',
    color: '#EF4444',
    flex: 1,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#F9FAFB',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#4B5563',
    marginLeft: 12,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 16,
  },
});
