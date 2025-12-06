import { api } from './api';

export interface QuickActionChip {
  id: string;
  label: string;
  icon: string;
}

export interface RichMediaCard {
  type: 'salon' | 'service' | 'product' | 'look';
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  imageUrls?: string[];
  rating?: number;
  reviewCount?: number;
  price?: string;
  distance?: string;
  duration?: string;
  ctaLabel?: string;
  ctaAction?: string;
}

export interface RelatedService {
  id: string;
  name: string;
  category: string;
  priceRange: string;
  imageUrl?: string;
  duration?: string;
}

export interface RelatedSalon {
  id: string;
  name: string;
  rating: number;
  distance?: string;
  imageUrl?: string;
  reviewCount?: number;
  address?: string;
}

export interface AIConsultantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  followUps?: string[];
  richMedia?: RichMediaCard[];
  relatedServices?: RelatedService[];
  relatedSalons?: RelatedSalon[];
}

export interface ChatRequest {
  message: string;
  intent?: string;
  location?: { lat: number; lng: number };
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  reply: string;
  suggestions?: string[];
  followUps?: string[];
  richMedia?: RichMediaCard[];
  relatedServices?: RelatedService[];
  relatedSalons?: RelatedSalon[];
}

export const aiConsultantAPI = {
  getQuickActionChips: async (): Promise<{ chips: QuickActionChip[] }> => {
    try {
      const response = await api.get('/api/ai-consultant/chips');
      return response.data;
    } catch (error) {
      console.error('[AI Consultant] Failed to fetch chips:', error);
      return {
        chips: [
          { id: 'recommend_hairstyle', label: 'Hairstyle Ideas', icon: 'scissors' },
          { id: 'skincare_routine', label: 'Skincare Tips', icon: 'sparkles' },
          { id: 'makeup_tips', label: 'Makeup Guide', icon: 'palette' },
          { id: 'find_salon', label: 'Find Salons', icon: 'map-pin' },
          { id: 'trending_looks', label: 'Trending Now', icon: 'trending-up' },
          { id: 'bridal_beauty', label: 'Bridal Beauty', icon: 'heart' },
        ],
      };
    }
  },

  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post('/api/ai-consultant/chat', request);
    return response.data;
  },

  sendQuickQuery: async (
    intent: string,
    location?: { lat: number; lng: number }
  ): Promise<ChatResponse> => {
    const response = await api.post('/api/ai-consultant/quick-query', {
      intent,
      location,
    });
    return response.data;
  },
};
