import { useQuery } from "@tanstack/react-query";

export interface SubscriptionTier {
  id: string;
  name: string;
  slug: string;
  monthlyPricePaisa: number;
  yearlyPricePaisa: number;
  maxStaff: number | null;
  maxServices: number | null;
  features: string[];
}

export interface SalonSubscription {
  id: string;
  salonId: string;
  tierId: string;
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'expired';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt: string | null;
  tier: SubscriptionTier;
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: SalonSubscription | null;
  tier: SubscriptionTier | null;
  isActive: boolean;
  isTrial: boolean;
  isPremium: boolean;
  isGrowth: boolean;
  isElite: boolean;
}

export function useSubscription(salonId: string | null) {
  const { data, isLoading, error, refetch } = useQuery<{
    subscription: SalonSubscription | null;
    tier: SubscriptionTier | null;
  }>({
    queryKey: ['/api/subscriptions/salon', salonId, 'status'],
    queryFn: async () => {
      if (!salonId) return { subscription: null, tier: null };
      const response = await fetch(`/api/subscriptions/salon/${salonId}/status`);
      if (!response.ok) {
        if (response.status === 404) {
          return { subscription: null, tier: null };
        }
        throw new Error('Failed to fetch subscription status');
      }
      return response.json();
    },
    enabled: !!salonId,
    staleTime: 5 * 60 * 1000,
  });

  const subscription = data?.subscription ?? null;
  const tier = data?.tier ?? subscription?.tier ?? null;
  
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isTrial = subscription?.status === 'trialing';
  const tierSlug = tier?.slug || 'free';
  const isGrowth = tierSlug === 'growth' && isActive;
  const isElite = tierSlug === 'elite' && isActive;
  const isPremium = isGrowth || isElite;

  const status: SubscriptionStatus = {
    hasSubscription: !!subscription,
    subscription,
    tier,
    isActive,
    isTrial,
    isPremium,
    isGrowth,
    isElite,
  };

  return {
    ...status,
    isLoading,
    error,
    refetch,
  };
}

export function useFeatureAccess(salonId: string | null) {
  const subscription = useSubscription(salonId);
  
  return {
    ...subscription,
    canAccessAdvancedAnalytics: subscription.isPremium,
    canAccessLoyaltyPrograms: subscription.isPremium,
    canAccessAIRecommendations: subscription.isPremium,
    canAccessMetaBooking: subscription.isPremium,
    canAccessReserveWithGoogle: subscription.isElite,
    canAccessAPIAccess: subscription.isElite,
    canAccessMessengerChatbot: subscription.isElite,
    maxStaff: subscription.tier?.maxStaff ?? 3,
    maxServices: subscription.tier?.maxServices ?? 10,
  };
}
