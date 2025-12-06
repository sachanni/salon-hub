import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatConversation } from '../../types/chat';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationsListScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    conversations,
    isConnected,
    isConnecting,
    loadConversations,
    setActiveConversation,
  } = useChat();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadConversations();
    }
  }, [isAuthenticated, loadConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  }, [loadConversations]);

  const handleConversationPress = (conversation: ChatConversation) => {
    setActiveConversation(conversation);
    router.push({
      pathname: '/chat/[conversationId]',
      params: { conversationId: conversation.id },
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return '';
    }
  };

  const renderConversation = ({ item }: { item: ChatConversation }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleConversationPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.salonLogo ? (
          <Image source={{ uri: item.salonLogo }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="storefront" size={24} color="#9333EA" />
          </View>
        )}
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>
              {item.unreadCount > 99 ? '99+' : item.unreadCount}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.conversationContent}>
        <View style={styles.conversationHeader}>
          <Text style={styles.salonName} numberOfLines={1}>
            {item.salonName || 'Salon'}
          </Text>
          <Text style={styles.timestamp}>{formatTime(item.lastMessageAt)}</Text>
        </View>
        <Text
          style={[
            styles.lastMessage,
            item.unreadCount > 0 && styles.unreadMessage,
          ]}
          numberOfLines={1}
        >
          {item.lastMessage || 'Start a conversation'}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySubtitle}>
        Start a conversation with a salon to ask questions, discuss services, or
        get personalized recommendations.
      </Text>
      <TouchableOpacity
        style={styles.exploreSalonsButton}
        onPress={() => router.push('/home')}
      >
        <Text style={styles.exploreSalonsText}>Explore Salons</Text>
      </TouchableOpacity>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.connectionStatus}>
        <View
          style={[
            styles.statusDot,
            isConnected ? styles.statusConnected : styles.statusDisconnected,
          ]}
        />
        <Text style={styles.statusText}>
          {isConnecting ? 'Connecting...' : isConnected ? 'Online' : 'Offline'}
        </Text>
      </View>
    </View>
  );

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.loginPrompt}>
          <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
          <Text style={styles.loginTitle}>Sign in to chat</Text>
          <Text style={styles.loginSubtitle}>
            Log in to start conversations with salons
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/onboarding/phone')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        {renderHeader()}
      </View>

      {isConnecting && conversations.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9333EA" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            conversations.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#9333EA"
              colors={['#9333EA']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusConnected: {
    backgroundColor: '#10B981',
  },
  statusDisconnected: {
    backgroundColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#9333EA',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  conversationContent: {
    flex: 1,
    marginRight: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  salonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
  },
  unreadMessage: {
    color: '#1F2937',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  exploreSalonsButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreSalonsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
