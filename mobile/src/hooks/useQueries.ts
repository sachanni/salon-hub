import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salonAPI, shopAPI, eventsAPI, loyaltyAPI, favoritesAPI, referralAPI, offersAPI, notificationAPI, walletAPI } from '../services/api';

export const queryKeys = {
  salons: {
    all: ['salons'] as const,
    list: (params?: any) => [...queryKeys.salons.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.salons.all, 'detail', id] as const,
    nearby: (lat: number, lng: number, radius: number) => [...queryKeys.salons.all, 'nearby', lat, lng, radius] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  shop: {
    all: ['shop'] as const,
    products: (params?: any) => [...queryKeys.shop.all, 'products', params] as const,
    product: (id: string) => [...queryKeys.shop.all, 'product', id] as const,
    categories: ['shop', 'categories'] as const,
    cart: ['shop', 'cart'] as const,
    wishlist: ['shop', 'wishlist'] as const,
    orders: ['shop', 'orders'] as const,
    order: (id: string) => [...queryKeys.shop.all, 'order', id] as const,
  },
  events: {
    all: ['events'] as const,
    list: (params?: any) => [...queryKeys.events.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.events.all, 'detail', id] as const,
    myEvents: ['events', 'myEvents'] as const,
    featured: ['events', 'featured'] as const,
  },
  loyalty: {
    all: ['loyalty'] as const,
    tiers: ['loyalty', 'tiers'] as const,
    userPoints: ['loyalty', 'userPoints'] as const,
    transactions: (params?: any) => [...queryKeys.loyalty.all, 'transactions', params] as const,
    rewards: ['loyalty', 'rewards'] as const,
  },
  favorites: {
    all: ['favorites'] as const,
    salons: ['favorites', 'salons'] as const,
    stylists: ['favorites', 'stylists'] as const,
  },
  referral: {
    all: ['referral'] as const,
    myCode: ['referral', 'myCode'] as const,
    stats: ['referral', 'stats'] as const,
    history: ['referral', 'history'] as const,
  },
  offers: {
    all: ['offers'] as const,
    list: (params?: any) => [...queryKeys.offers.all, 'list', params] as const,
    trending: ['offers', 'trending'] as const,
    saved: ['offers', 'saved'] as const,
    count: ['offers', 'count'] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: ['notifications', 'list'] as const,
    unreadCount: ['notifications', 'unreadCount'] as const,
  },
  wallet: {
    all: ['wallet'] as const,
    balance: ['wallet', 'balance'] as const,
    transactions: ['wallet', 'transactions'] as const,
  },
  user: {
    all: ['user'] as const,
    profile: ['user', 'profile'] as const,
  },
};

export function useSalons(params?: { lat?: number; lng?: number; radiusKm?: number; category?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.salons.list(params),
    queryFn: () => salonAPI.getAllSalons(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSalonDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.salons.detail(id),
    queryFn: () => salonAPI.getSalonById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useShopCategories() {
  return useQuery({
    queryKey: queryKeys.shop.categories,
    queryFn: () => shopAPI.getCategories(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useShopProducts(params?: { category?: string; search?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: queryKeys.shop.products(params),
    queryFn: () => shopAPI.getProducts(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useShopProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.shop.product(id),
    queryFn: () => shopAPI.getProductById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useCart(salonId?: string) {
  return useQuery({
    queryKey: queryKeys.shop.cart,
    queryFn: () => shopAPI.getCart(salonId),
    staleTime: 1000 * 60 * 2,
  });
}

export function useWishlist() {
  return useQuery({
    queryKey: queryKeys.shop.wishlist,
    queryFn: () => shopAPI.getWishlist(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.shop.orders,
    queryFn: () => shopAPI.getOrders(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useEvents(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: queryKeys.events.list(params),
    queryFn: () => eventsAPI.getEvents(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useEventDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.events.detail(id),
    queryFn: () => eventsAPI.getEventById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });
}

export function useMyEvents(params?: { status?: 'upcoming' | 'attended' | 'cancelled' }) {
  return useQuery({
    queryKey: queryKeys.events.myEvents,
    queryFn: () => eventsAPI.getMyRegistrations(params),
    staleTime: 1000 * 60 * 2,
  });
}

export function useFeaturedEvents() {
  return useQuery({
    queryKey: queryKeys.events.featured,
    queryFn: () => eventsAPI.getEvents({ featured: true }),
    staleTime: 1000 * 60 * 10,
  });
}

export function useLoyaltyTiers() {
  return useQuery({
    queryKey: queryKeys.loyalty.tiers,
    queryFn: () => loyaltyAPI.getTiers(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useUserPoints() {
  return useQuery({
    queryKey: queryKeys.loyalty.userPoints,
    queryFn: () => loyaltyAPI.getPoints(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useLoyaltyTransactions(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: queryKeys.loyalty.transactions(params),
    queryFn: () => loyaltyAPI.getTransactions(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLoyaltyRewards() {
  return useQuery({
    queryKey: queryKeys.loyalty.rewards,
    queryFn: () => loyaltyAPI.getRewards(),
    staleTime: 1000 * 60 * 30,
  });
}

export function useFavoriteSalons() {
  return useQuery({
    queryKey: queryKeys.favorites.salons,
    queryFn: () => favoritesAPI.getFavoriteSalons(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useFavoriteStylists() {
  return useQuery({
    queryKey: queryKeys.favorites.stylists,
    queryFn: () => favoritesAPI.getFavoriteStylists(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useReferralCode() {
  return useQuery({
    queryKey: queryKeys.referral.myCode,
    queryFn: () => referralAPI.getMyCode(),
    staleTime: 1000 * 60 * 60,
  });
}

export function useReferralStats() {
  return useQuery({
    queryKey: queryKeys.referral.stats,
    queryFn: () => referralAPI.getStats(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useReferralHistory() {
  return useQuery({
    queryKey: queryKeys.referral.history,
    queryFn: () => referralAPI.getHistory(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOffers(params?: { category?: string }) {
  return useQuery({
    queryKey: queryKeys.offers.list(params),
    queryFn: () => offersAPI.getOffers(params),
    staleTime: 1000 * 60 * 10,
  });
}

export function useTrendingOffers() {
  return useQuery({
    queryKey: queryKeys.offers.trending,
    queryFn: () => offersAPI.getTrendingOffers(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSavedOffers() {
  return useQuery({
    queryKey: queryKeys.offers.saved,
    queryFn: () => offersAPI.getSavedOffers(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useOfferCount() {
  return useQuery({
    queryKey: queryKeys.offers.count,
    queryFn: () => offersAPI.getOfferCount(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications.list,
    queryFn: () => notificationAPI.getNotifications(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount,
    queryFn: () => notificationAPI.getUnreadCount(),
    staleTime: 1000 * 30,
  });
}

export function useWalletBalance() {
  return useQuery({
    queryKey: queryKeys.wallet.balance,
    queryFn: () => walletAPI.getWallet(),
    staleTime: 1000 * 60 * 2,
  });
}

export function useWalletTransactions() {
  return useQuery({
    queryKey: queryKeys.wallet.transactions,
    queryFn: () => walletAPI.getTransactions(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, quantity, salonId }: { productId: string; quantity: number; salonId: string }) =>
      shopAPI.addToCart({ productId, quantity, salonId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shop.cart });
    },
  });
}

export function useUpdateCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      shopAPI.updateCartItem(itemId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shop.cart });
    },
  });
}

export function useRemoveFromCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => shopAPI.removeCartItem(itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shop.cart });
    },
  });
}

export function useClearCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (salonId?: string) => shopAPI.clearCart(salonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shop.cart });
    },
  });
}

export function useAddToWishlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => shopAPI.addToWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shop.wishlist });
    },
  });
}

export function useRemoveFromWishlistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => shopAPI.removeFromWishlist(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shop.wishlist });
    },
  });
}

export function useAddFavoriteSalonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (salonId: string) => favoritesAPI.addFavoriteSalon(salonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.salons });
    },
  });
}

export function useRemoveFavoriteSalonMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (salonId: string) => favoritesAPI.removeFavoriteSalon(salonId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.salons });
    },
  });
}

export function useAddFavoriteStylistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stylistId: string) => favoritesAPI.addFavoriteStylist(stylistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.stylists });
    },
  });
}

export function useRemoveFavoriteStylistMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (stylistId: string) => favoritesAPI.removeFavoriteStylist(stylistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.favorites.stylists });
    },
  });
}

export function useApplyReferralCodeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => referralAPI.applyCode(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.referral.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.userPoints });
    },
  });
}

export function useSaveOfferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => offersAPI.saveOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.saved });
    },
  });
}

export function useUnsaveOfferMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => offersAPI.unsaveOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.offers.saved });
    },
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationAPI.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationAPI.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}

export function useRedeemRewardMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => loyaltyAPI.redeemReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.all });
    },
  });
}
