import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Keyboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { ChatMessage } from '../../types/chat';
import { format, isToday, isYesterday, isSameDay } from 'date-fns';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const conversationId = params.conversationId as string;
  const { user } = useAuth();
  const {
    messages,
    activeConversation,
    typingUsers,
    isConnected,
    loadMessages,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    markAsRead,
    setActiveConversation,
  } = useChat();

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);

  const conversationMessages = messages[conversationId || ''] || [];
  const typingIndicators = typingUsers[conversationId || ''] || [];

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    }

    return () => {
      if (conversationId) {
        setActiveConversation(null);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (conversationMessages.length > 0 && conversationId) {
      const lastMessage = conversationMessages[conversationMessages.length - 1];
      if (lastMessage.senderId !== user?.id) {
        markAsRead(conversationId, lastMessage.id);
      }
    }
  }, [conversationMessages.length, conversationId, user?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || isSending) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);
    Keyboard.dismiss();

    if (isTypingRef.current) {
      sendTypingStop(conversationId);
      isTypingRef.current = false;
    }

    try {
      await sendMessage({
        conversationId,
        body: messageText,
        messageType: 'text',
      });

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (!conversationId) return;

    if (text.length > 0 && !isTypingRef.current) {
      sendTypingStart(conversationId);
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current && conversationId) {
        sendTypingStop(conversationId);
        isTypingRef.current = false;
      }
    }, 2000);
  };

  const handleLoadMore = async () => {
    if (isLoadingMore || !conversationId || conversationMessages.length === 0)
      return;

    setIsLoadingMore(true);
    await loadMessages(conversationId, true);
    setIsLoadingMore(false);
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch {
      return '';
    }
  };

  const formatDateSeparator = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) return 'Today';
      if (isYesterday(date)) return 'Yesterday';
      return format(date, 'MMMM d, yyyy');
    } catch {
      return '';
    }
  };

  const shouldShowDateSeparator = (
    message: ChatMessage,
    previousMessage?: ChatMessage
  ) => {
    if (!previousMessage) return true;
    try {
      return !isSameDay(
        new Date(message.sentAt),
        new Date(previousMessage.sentAt)
      );
    } catch {
      return false;
    }
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const isOwnMessage = item.senderId === user?.id;
    const previousMessage = conversationMessages[index - 1];
    const showDateSeparator = shouldShowDateSeparator(item, previousMessage);

    return (
      <>
        {showDateSeparator && (
          <View style={styles.dateSeparator}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>
              {formatDateSeparator(item.sentAt)}
            </Text>
            <View style={styles.dateLine} />
          </View>
        )}
        <View
          style={[
            styles.messageContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          {!isOwnMessage && (
            <View style={styles.senderAvatar}>
              {item.senderAvatar ? (
                <Image
                  source={{ uri: item.senderAvatar }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {(item.senderName || 'S')[0].toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          )}
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessageBubble : styles.otherMessageBubble,
            ]}
          >
            {!isOwnMessage && item.senderName && (
              <Text style={styles.senderName}>{item.senderName}</Text>
            )}
            <Text
              style={[
                styles.messageText,
                isOwnMessage
                  ? styles.ownMessageText
                  : styles.otherMessageText,
              ]}
            >
              {item.body}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isOwnMessage
                    ? styles.ownMessageTime
                    : styles.otherMessageTime,
                ]}
              >
                {formatMessageTime(item.sentAt)}
              </Text>
              {isOwnMessage && (
                <Ionicons
                  name={item.deliveredAt ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={item.readAt ? '#9333EA' : 'rgba(255,255,255,0.7)'}
                  style={styles.checkmark}
                />
              )}
            </View>
          </View>
        </View>
      </>
    );
  };

  const renderTypingIndicator = () => {
    if (typingIndicators.length === 0) return null;

    const names = typingIndicators.map((t) => t.userName).join(', ');

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
          <Text style={styles.typingText}>{names} is typing</Text>
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={24} color="#1F2937" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7}>
        {activeConversation?.salonLogo ? (
          <Image
            source={{ uri: activeConversation.salonLogo }}
            style={styles.headerAvatar}
          />
        ) : (
          <View style={styles.headerAvatarPlaceholder}>
            <Ionicons name="storefront" size={20} color="#9333EA" />
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {activeConversation?.salonName || 'Chat'}
          </Text>
          <View style={styles.headerStatusContainer}>
            <View
              style={[
                styles.headerStatusDot,
                isConnected
                  ? styles.statusConnected
                  : styles.statusDisconnected,
              ]}
            />
            <Text style={styles.headerStatus}>
              {isConnected ? 'Online' : 'Offline'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {renderHeader()}

      <FlatList
        ref={flatListRef}
        data={conversationMessages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => {}}
        onEndReachedThreshold={0.1}
        ListHeaderComponent={
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#9333EA" />
            </View>
          ) : null
        }
        ListFooterComponent={renderTypingIndicator}
        onContentSizeChange={() => {
          if (conversationMessages.length > 0) {
            flatListRef.current?.scrollToEnd({ animated: false });
          }
        }}
        inverted={false}
      />

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="add-circle-outline" size={28} color="#9333EA" />
        </TouchableOpacity>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={1000}
            editable={isConnected}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isSending || !isConnected) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending || !isConnected}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusConnected: {
    backgroundColor: '#10B981',
  },
  statusDisconnected: {
    backgroundColor: '#EF4444',
  },
  headerStatus: {
    fontSize: 12,
    color: '#6B7280',
  },
  moreButton: {
    padding: 8,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  loadingMore: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dateText: {
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    maxWidth: '85%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
  },
  senderAvatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatarImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  avatarPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333EA',
  },
  messageBubble: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '100%',
  },
  ownMessageBubble: {
    backgroundColor: '#9333EA',
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9333EA',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#1F2937',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  ownMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#9CA3AF',
  },
  checkmark: {
    marginLeft: 4,
  },
  typingContainer: {
    paddingVertical: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  typingDots: {
    flexDirection: 'row',
    marginRight: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.8,
  },
  typingText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  attachButton: {
    padding: 6,
    marginRight: 8,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
  },
  input: {
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#9333EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
});
