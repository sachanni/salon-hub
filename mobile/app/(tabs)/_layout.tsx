import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../src/contexts/ChatContext';

type TabIconProps = {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
  badge?: number;
};

function TabIcon({ name, color, focused, badge }: TabIconProps) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerFocused]}>
      <Ionicons name={name} size={24} color={color} />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

function MessagesTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { unreadTotal } = useChat();
  return (
    <TabIcon 
      name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
      color={color} 
      focused={focused} 
      badge={unreadTotal}
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="at-salon"
        options={{
          title: 'At Salon',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'cut' : 'cut-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="at-home"
        options={{
          title: 'At Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'calendar' : 'calendar-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <MessagesTabIcon color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name={focused ? 'bag' : 'bag-outline'} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  tabItem: {
    paddingTop: 4,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerFocused: {
    transform: [{ scale: 1.1 }],
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
