import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';

interface SavedCard {
  id: string;
  last4: string;
  cardType: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
  createdAt: string;
}

export default function SavedCardsScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedCards();
  }, []);

  const fetchSavedCards = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/mobile/payment-methods');
      setCards(response.data.cards || []);
    } catch (error) {
      console.error('Error fetching saved cards:', error);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = (card: SavedCard) => {
    Alert.alert(
      'Remove Card',
      `Are you sure you want to remove the card ending in ${card.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(card.id);
              await api.delete(`/api/mobile/payment-methods/${card.id}`);
              setCards((prev) => prev.filter((c) => c.id !== card.id));
            } catch (error) {
              console.error('Error deleting card:', error);
              Alert.alert('Error', 'Failed to remove card. Please try again.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      await api.post(`/api/mobile/payment-methods/${cardId}/set-default`);
      setCards((prev) =>
        prev.map((card) => ({
          ...card,
          isDefault: card.id === cardId,
        }))
      );
    } catch (error) {
      console.error('Error setting default card:', error);
      Alert.alert('Error', 'Failed to set default card.');
    }
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return 'card';
      case 'mastercard':
        return 'card';
      case 'rupay':
        return 'card';
      default:
        return 'card-outline';
    }
  };

  const getCardColor = (cardType: string): [string, string] => {
    switch (cardType.toLowerCase()) {
      case 'visa':
        return ['#1A1F71', '#0066CC'];
      case 'mastercard':
        return ['#EB001B', '#F79E1B'];
      case 'rupay':
        return ['#097969', '#00A36C'];
      default:
        return ['#374151', '#6B7280'];
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={styles.loadingText}>Loading saved cards...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {cards.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="card-outline" size={48} color="#9CA3AF" />
            </View>
            <Text style={styles.emptyTitle}>No Saved Cards</Text>
            <Text style={styles.emptyText}>
              Your saved payment methods will appear here. Cards are saved when you make a booking with deposit.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Your Cards</Text>
            {cards.map((card) => (
              <View key={card.id} style={styles.cardItem}>
                <LinearGradient
                  colors={getCardColor(card.cardType)}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardPreview}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardType}>{card.cardType.toUpperCase()}</Text>
                    {card.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Default</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardNumber}>•••• •••• •••• {card.last4}</Text>
                  <View style={styles.cardFooter}>
                    <View>
                      <Text style={styles.cardLabel}>CARDHOLDER</Text>
                      <Text style={styles.cardValue}>{card.cardholderName || 'CARD HOLDER'}</Text>
                    </View>
                    <View>
                      <Text style={styles.cardLabel}>EXPIRES</Text>
                      <Text style={styles.cardValue}>
                        {card.expiryMonth}/{card.expiryYear}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                <View style={styles.cardActions}>
                  {!card.isDefault && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetDefault(card.id)}
                    >
                      <Ionicons name="checkmark-circle-outline" size={18} color="#8B5CF6" />
                      <Text style={styles.actionButtonText}>Set as Default</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteCard(card)}
                    disabled={deleting === card.id}
                  >
                    {deleting === card.id ? (
                      <ActivityIndicator size="small" color="#EF4444" />
                    ) : (
                      <>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        <Text style={styles.deleteButtonText}>Remove</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your cards are secure</Text>
            <Text style={styles.infoText}>
              Card details are encrypted and securely stored via Razorpay. We never store your full card number.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  cardItem: {
    marginBottom: 16,
  },
  cardPreview: {
    borderRadius: 16,
    padding: 20,
    minHeight: 180,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardType: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  defaultBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 24,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8B5CF6',
  },
  deleteButton: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#EF4444',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
  },
});
