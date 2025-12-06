import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  aiConsultantAPI,
  type AIConsultantMessage,
  type QuickActionChip,
  type ChatResponse,
  type RichMediaCard,
} from '../services/aiConsultantService';
import { locationService } from '../services/locationService';
import { useAuth } from './AuthContext';

interface AIConsultantContextType {
  isOpen: boolean;
  openConsultant: () => void;
  closeConsultant: () => void;
  messages: AIConsultantMessage[];
  isLoading: boolean;
}

const AIConsultantContext = createContext<AIConsultantContextType | null>(null);

export function useAIConsultant() {
  const context = useContext(AIConsultantContext);
  if (!context) {
    throw new Error('useAIConsultant must be used within AIConsultantProvider');
  }
  return context;
}

interface AIConsultantProviderProps {
  children: React.ReactNode;
}

export function AIConsultantProvider({ children }: AIConsultantProviderProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIConsultantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [chips, setChips] = useState<QuickActionChip[]>([]);
  const [slideAnim] = useState(new Animated.Value(0));
  const [authError, setAuthError] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const [chipsLoaded, setChipsLoaded] = useState(false);

  const loadChips = useCallback(async () => {
    if (chipsLoaded) return;
    try {
      const response = await aiConsultantAPI.getQuickActionChips();
      setChips(response.chips);
      setChipsLoaded(true);
    } catch (error) {
      console.error('[AI Consultant] Failed to load chips from API, using defaults');
      setChips([
        { id: 'recommend_hairstyle', label: 'Hairstyle Ideas', icon: 'scissors' },
        { id: 'skincare_routine', label: 'Skincare Tips', icon: 'sparkles' },
        { id: 'makeup_tips', label: 'Makeup Guide', icon: 'palette' },
        { id: 'find_salon', label: 'Find Salons', icon: 'map-pin' },
        { id: 'trending_looks', label: 'Trending Now', icon: 'trending-up' },
        { id: 'bridal_beauty', label: 'Bridal Beauty', icon: 'heart' },
      ]);
      setChipsLoaded(true);
    }
  }, [chipsLoaded]);

  const openConsultant = useCallback(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Login Required',
        'Please log in to use the AI Beauty Consultant for personalized recommendations.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Log In', 
            onPress: () => router.push('/onboarding/phone'),
          },
        ]
      );
      return;
    }
    loadChips();
    setAuthError(false);
    setIsOpen(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [slideAnim, isAuthenticated, router, loadChips]);

  const closeConsultant = useCallback(() => {
    Keyboard.dismiss();
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsOpen(false);
    });
  }, [slideAnim]);

  const getLocation = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      if (location && location.coords) {
        return { lat: location.coords.latitude, lng: location.coords.longitude };
      }
    } catch (error) {
      console.warn('[AI Consultant] Could not get location:', error);
    }
    return undefined;
  };

  const sendMessage = async (text: string, intent?: string) => {
    if (!text.trim() && !intent) return;

    const userMessage: AIConsultantMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text || getIntentLabel(intent || ''),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const location = await getLocation();
      const conversationHistory = messages.slice(-8).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      let response: ChatResponse;
      if (intent && !text) {
        response = await aiConsultantAPI.sendQuickQuery(intent, location);
      } else {
        response = await aiConsultantAPI.sendMessage({
          message: text,
          intent,
          location,
          conversationHistory,
        });
      }

      const assistantMessage: AIConsultantMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        suggestions: response.suggestions,
        followUps: response.followUps,
        richMedia: response.richMedia,
        relatedServices: response.relatedServices,
        relatedSalons: response.relatedSalons,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setAuthError(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error: any) {
      const statusCode = error.response?.status;
      const errorMsg = error.response?.data?.error || 'Sorry, I could not process your request. Please try again.';
      
      if (statusCode === 401) {
        setAuthError(true);
        const errorMessage: AIConsultantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Your session has expired. Please log in again to continue using the AI Beauty Consultant.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } else {
        const errorMessage: AIConsultantMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: errorMsg,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChipPress = (chip: QuickActionChip) => {
    sendMessage('', chip.id);
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const getIntentLabel = (intent: string): string => {
    const labels: Record<string, string> = {
      recommend_hairstyle: 'Recommend a hairstyle for me',
      skincare_routine: 'What skincare routine should I follow?',
      makeup_tips: 'Give me some makeup tips',
      find_salon: 'Help me find salons nearby',
      trending_looks: "What's trending in beauty right now?",
      bridal_beauty: 'Tell me about bridal beauty',
      men_grooming: "What are men's grooming tips?",
      nail_art: 'Show me nail art ideas',
    };
    return labels[intent] || intent;
  };

  const getChipIcon = (iconName: string): keyof typeof Ionicons.glyphMap => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      scissors: 'cut-outline',
      sparkles: 'sparkles-outline',
      palette: 'color-palette-outline',
      'map-pin': 'location-outline',
      'trending-up': 'trending-up-outline',
      heart: 'heart-outline',
      user: 'person-outline',
      brush: 'brush-outline',
    };
    return iconMap[iconName] || 'ellipse-outline';
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [700, 0],
  });

  const backdropOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const handleCardPress = (card: RichMediaCard) => {
    if (card.ctaAction) {
      router.push(card.ctaAction as any);
    } else {
      if (card.type === 'salon') {
        router.push(`/salon/${card.id}` as any);
      } else if (card.type === 'service') {
        router.push(`/booking?service=${card.id}` as any);
      } else if (card.type === 'product') {
        router.push(`/shop/product/${card.id}` as any);
      }
    }
  };

  const renderRichMediaCard = (card: RichMediaCard) => (
    <TouchableOpacity
      key={`${card.type}-${card.id}`}
      style={styles.mediaCard}
      onPress={() => handleCardPress(card)}
      activeOpacity={0.8}
    >
      {card.imageUrl && (
        <View style={styles.mediaCardImageContainer}>
          <Image
            source={{ uri: card.imageUrl }}
            style={styles.mediaCardImage}
            resizeMode="cover"
          />
          {card.type === 'salon' && card.rating && (
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={10} color="#FBBF24" />
              <Text style={styles.ratingText}>{card.rating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      )}
      <View style={styles.mediaCardContent}>
        <Text style={styles.mediaCardTitle} numberOfLines={1}>{card.title}</Text>
        {card.subtitle && (
          <Text style={styles.mediaCardSubtitle} numberOfLines={1}>{card.subtitle}</Text>
        )}
        <View style={styles.mediaCardMeta}>
          {card.price && (
            <Text style={styles.mediaCardPrice}>{card.price}</Text>
          )}
          {card.duration && (
            <View style={styles.mediaCardMetaItem}>
              <Ionicons name="time-outline" size={10} color="#6B7280" />
              <Text style={styles.mediaCardMetaText}>{card.duration}</Text>
            </View>
          )}
          {card.distance && (
            <View style={styles.mediaCardMetaItem}>
              <Ionicons name="location-outline" size={10} color="#6B7280" />
              <Text style={styles.mediaCardMetaText}>{card.distance}</Text>
            </View>
          )}
        </View>
        {card.ctaLabel && (
          <View style={styles.mediaCardCta}>
            <Text style={styles.mediaCardCtaText}>{card.ctaLabel}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: AIConsultantMessage }) => (
    <View
      style={[
        styles.messageContainer,
        item.role === 'user' ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      {item.role === 'assistant' && (
        <View style={styles.avatarContainer}>
          <Ionicons name="sparkles" size={16} color="#8B5CF6" />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          item.role === 'user' ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.role === 'user' ? styles.userText : styles.assistantText,
          ]}
        >
          {item.content}
        </Text>
      </View>
      {item.richMedia && item.richMedia.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.richMediaContainer}
          contentContainerStyle={styles.richMediaContent}
        >
          {item.richMedia.map((card) => renderRichMediaCard(card))}
        </ScrollView>
      )}
      {item.suggestions && item.suggestions.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
        >
          {item.suggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const value = {
    isOpen,
    openConsultant,
    closeConsultant,
    messages,
    isLoading,
  };

  return (
    <AIConsultantContext.Provider value={value}>
      {children}

      <TouchableOpacity
        style={styles.fab}
        onPress={openConsultant}
        activeOpacity={0.9}
      >
        <Ionicons name="sparkles" size={24} color="#FFF" />
      </TouchableOpacity>

      {isOpen && (
        <Modal
          transparent
          visible={isOpen}
          animationType="none"
          onRequestClose={closeConsultant}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <Animated.View
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            >
              <TouchableOpacity
                style={StyleSheet.absoluteFill}
                onPress={closeConsultant}
                activeOpacity={1}
              />
            </Animated.View>

            <Animated.View
              style={[styles.bottomSheet, { transform: [{ translateY }] }]}
            >
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>AI Beauty Consultant</Text>
                    <Text style={styles.headerSubtitle}>Your personal beauty advisor</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={closeConsultant} style={styles.closeButton}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {messages.length === 0 ? (
                <View style={styles.welcomeContainer}>
                  <Text style={styles.welcomeTitle}>How can I help you today?</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Tap a topic below or type your question
                  </Text>
                  <View style={styles.chipsGrid}>
                    {chips.map((chip) => (
                      <TouchableOpacity
                        key={chip.id}
                        style={styles.chip}
                        onPress={() => handleChipPress(chip)}
                      >
                        <Ionicons
                          name={getChipIcon(chip.icon)}
                          size={18}
                          color="#8B5CF6"
                        />
                        <Text style={styles.chipText}>{chip.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  style={styles.messagesList}
                  contentContainerStyle={styles.messagesContent}
                  showsVerticalScrollIndicator={false}
                  onContentSizeChange={() =>
                    flatListRef.current?.scrollToEnd({ animated: true })
                  }
                />
              )}

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask me anything about beauty..."
                  placeholderTextColor="#9CA3AF"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
                  ]}
                  onPress={() => sendMessage(inputText)}
                  disabled={!inputText.trim() || isLoading}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={inputText.trim() && !isLoading ? '#FFF' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </AIConsultantContext.Provider>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  bottomSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  welcomeContainer: {
    flex: 1,
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F5F3FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6D28D9',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 16,
  },
  messageContainer: {
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#8B5CF6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFF',
  },
  assistantText: {
    color: '#1F2937',
  },
  suggestionsContainer: {
    marginTop: 8,
    marginLeft: 32,
  },
  suggestionChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 13,
    color: '#6D28D9',
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFF',
    gap: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 15,
    color: '#111827',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  richMediaContainer: {
    marginTop: 8,
    marginLeft: 32,
  },
  richMediaContent: {
    paddingRight: 16,
    gap: 8,
  },
  mediaCard: {
    width: 140,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    marginRight: 8,
  },
  mediaCardImageContainer: {
    height: 80,
    width: '100%',
    backgroundColor: '#F3F4F6',
  },
  mediaCardImage: {
    width: '100%',
    height: '100%',
  },
  ratingBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#111827',
  },
  mediaCardContent: {
    padding: 8,
  },
  mediaCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  mediaCardSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  mediaCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  mediaCardPrice: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  mediaCardMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  mediaCardMetaText: {
    fontSize: 9,
    color: '#6B7280',
  },
  mediaCardCta: {
    marginTop: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  mediaCardCtaText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFF',
  },
});
