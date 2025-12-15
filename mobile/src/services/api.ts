import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureStorage } from '../utils/secureStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await secureStorage.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Continue request without token if retrieval fails
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await secureStorage.clearAll();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

async function refreshAccessToken(): Promise<string> {
  const refreshToken = await secureStorage.getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${API_URL}/api/auth/mobile/refresh`, {
    refreshToken,
  });

  const { accessToken, refreshToken: newRefreshToken } = response.data;
  
  await secureStorage.setAccessToken(accessToken);
  if (newRefreshToken) {
    await secureStorage.setRefreshToken(newRefreshToken);
  }

  return accessToken;
}

export const authAPI = {
  requestOTP: async (phoneNumber: string) => {
    const response = await api.post('/api/auth/mobile/request-otp', { phoneNumber });
    return response.data;
  },

  verifyOTP: async (phoneNumber: string, otp: string) => {
    const response = await api.post('/api/auth/mobile/verify-otp', { phoneNumber, otp });
    return response.data;
  },

  resendOTP: async (phoneNumber: string) => {
    const response = await api.post('/api/auth/mobile/resend-otp', { phoneNumber });
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post('/api/auth/mobile/logout', { refreshToken });
    return response.data;
  },
};

// Salon API endpoints
export const salonAPI = {
  getAllSalons: async (params?: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    service?: string;
    location?: string;
    categories?: string;
  }) => {
    const response = await api.get('/api/salons', { params });
    return response.data;
  },

  getSalonById: async (salonId: string) => {
    const response = await api.get(`/api/salons/${salonId}`);
    return response.data;
  },

  getNearbySalons: async (salonId: string, radiusKm: number = 5) => {
    const response = await api.get(`/api/salons/${salonId}/nearby`, {
      params: { radiusKm },
    });
    return response.data;
  },

  getSalonServices: async (salonId: string, params?: {
    category?: string;
    gender?: string;
  }) => {
    const response = await api.get(`/api/salons/${salonId}/services`, { params });
    return response.data;
  },

  getSalonStaff: async (salonId: string) => {
    const response = await api.get(`/api/salons/${salonId}/staff`);
    return response.data;
  },

  getSalonReviews: async (salonId: string, params?: {
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get(`/api/salons/${salonId}/reviews`, { params });
    return response.data;
  },

  getSalonPackages: async (salonId: string) => {
    const response = await api.get(`/api/mobile/salons/${salonId}/packages`);
    return response.data;
  },

  getPackageDetails: async (salonId: string, packageId: string) => {
    const response = await api.get(`/api/mobile/salons/${salonId}/packages/${packageId}`);
    return response.data;
  },

  getAvailableSlots: async (salonId: string, date: string, serviceId?: string, staffId?: string) => {
    const params: any = { date };
    if (serviceId) params.serviceId = serviceId;
    if (staffId) params.staffId = staffId;
    const response = await api.get(`/api/salons/${salonId}/available-slots`, { params });
    return response.data;
  },
};

// Booking API endpoints
export const bookingAPI = {
  createBooking: async (bookingData: {
    salonId: string;
    serviceIds: string[];
    staffId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    bookingDate: string;
    bookingTime: string;
    paymentMethod: string;
    notes?: string;
    depositAmountPaisa?: number;
    giftCardId?: string;
    giftCardAmountPaisa?: number;
    packageId?: string;
    isPackageBooking?: boolean;
    totalPrice?: number;
    totalDuration?: number;
  }) => {
    const response = await api.post('/api/mobile/bookings', bookingData);
    return response.data;
  },

  getBookingById: async (bookingId: string) => {
    const response = await api.get(`/api/mobile/bookings/${bookingId}`);
    return response.data;
  },

  getUserBookings: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/mobile/bookings/my-bookings', { params });
    return response.data;
  },

  cancelBooking: async (bookingId: string, reason?: string) => {
    const response = await api.post(`/api/mobile/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  },
};

// User Profile API endpoints
export const userAPI = {
  getUserStats: async () => {
    const response = await api.get('/api/mobile/users/stats');
    return response.data;
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; phoneNumber?: string }) => {
    const response = await api.patch('/api/mobile/users/profile', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/api/mobile/users/profile');
    return response.data;
  },
};

// Wallet API endpoints
export const walletAPI = {
  getWallet: async () => {
    const response = await api.get('/api/mobile/wallet');
    return response.data;
  },

  getTransactions: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/api/mobile/wallet/transactions', { params });
    return response.data;
  },

  createAddMoneyOrder: async (amountInPaisa: number) => {
    const response = await api.post('/api/mobile/wallet/add-money/create-order', { amountInPaisa });
    return response.data;
  },

  verifyAddMoney: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    amountInPaisa: number;
  }) => {
    const response = await api.post('/api/mobile/wallet/add-money/verify', data);
    return response.data;
  },

  useWallet: async (data: { amountInPaisa: number; bookingId?: string; reason?: string }) => {
    const response = await api.post('/api/mobile/wallet/use', data);
    return response.data;
  },
};

// Notification API endpoints
export const notificationAPI = {
  getNotifications: async (params?: { limit?: number; offset?: number; unreadOnly?: boolean }) => {
    const response = await api.get('/api/mobile/notifications', { params });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/api/mobile/notifications/count');
    return response.data;
  },

  markAsRead: async (notificationId: string) => {
    const response = await api.post(`/api/mobile/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/api/mobile/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId: string) => {
    const response = await api.delete(`/api/mobile/notifications/${notificationId}`);
    return response.data;
  },

  registerPushToken: async (data: { token: string; platform: string; deviceId?: string }) => {
    const response = await api.post('/api/mobile/notifications/register-token', data);
    return response.data;
  },

  unregisterPushToken: async (token: string) => {
    const response = await api.post('/api/mobile/notifications/unregister-token', { token });
    return response.data;
  },
};

// Offers API endpoints
export const offersAPI = {
  getOffers: async (params?: {
    category?: string;
    salonId?: string;
    limit?: number;
    offset?: number;
    trending?: boolean;
  }) => {
    const response = await api.get('/api/mobile/offers', { params });
    return response.data;
  },

  getOfferById: async (offerId: string) => {
    const response = await api.get(`/api/mobile/offers/${offerId}`);
    return response.data;
  },

  getTrendingOffers: async (limit?: number) => {
    const response = await api.get('/api/mobile/offers/trending', { params: { limit } });
    return response.data;
  },

  getSavedOffers: async () => {
    const response = await api.get('/api/mobile/offers/saved');
    return response.data;
  },

  saveOffer: async (offerId: string) => {
    const response = await api.post(`/api/mobile/offers/${offerId}/save`);
    return response.data;
  },

  unsaveOffer: async (offerId: string) => {
    const response = await api.delete(`/api/mobile/offers/${offerId}/save`);
    return response.data;
  },

  getOfferCount: async () => {
    const response = await api.get('/api/mobile/offers/count');
    return response.data;
  },
};

// Shop API endpoints
export const shopAPI = {
  // Products
  getProducts: async (params?: {
    category?: string;
    search?: string;
    salonId?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/shop/products', { params });
    return response.data;
  },

  getProductById: async (productId: string) => {
    const response = await api.get(`/api/shop/products/${productId}`);
    return response.data;
  },

  getCategories: async () => {
    const response = await api.get('/api/shop/categories');
    return response.data;
  },

  getProductReviews: async (productId: string, params?: { limit?: number; offset?: number }) => {
    const response = await api.get(`/api/shop/products/${productId}/reviews`, { params });
    return response.data;
  },

  // Cart
  getCart: async (salonId?: string) => {
    const response = await api.get('/api/shop/cart', { params: salonId ? { salonId } : {} });
    return response.data;
  },

  addToCart: async (data: { productId: string; quantity: number; salonId: string }) => {
    const response = await api.post('/api/shop/cart', data);
    return response.data;
  },

  updateCartItem: async (itemId: string, quantity: number) => {
    const response = await api.patch(`/api/shop/cart/${itemId}`, { quantity });
    return response.data;
  },

  removeCartItem: async (itemId: string) => {
    const response = await api.delete(`/api/shop/cart/${itemId}`);
    return response.data;
  },

  clearCart: async (salonId?: string) => {
    const response = await api.delete('/api/shop/cart', { params: salonId ? { salonId } : {} });
    return response.data;
  },

  // Wishlist
  getWishlist: async () => {
    const response = await api.get('/api/shop/wishlist');
    return response.data;
  },

  addToWishlist: async (productId: string) => {
    const response = await api.post('/api/shop/wishlist', { productId });
    return response.data;
  },

  removeFromWishlist: async (productId: string) => {
    const response = await api.delete(`/api/shop/wishlist/${productId}`);
    return response.data;
  },

  // Payment
  createRazorpayOrder: async (data: {
    salonId?: string;
    fulfillmentType: 'pickup' | 'delivery';
  }) => {
    const response = await api.post('/api/payment/create-razorpay-order', data);
    return response.data;
  },

  verifyPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post('/api/payment/verify-payment', data);
    return response.data;
  },

  // Orders
  createOrder: async (data: {
    salonId?: string;
    fulfillmentType: 'pickup' | 'delivery';
    deliveryAddress?: any;
    paymentMethod?: 'razorpay' | 'pay_at_salon';
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
  }) => {
    const response = await api.post('/api/shop/orders', data);
    return response.data;
  },

  getOrders: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/shop/orders', { params });
    return response.data;
  },

  getOrderById: async (orderId: string) => {
    const response = await api.get(`/api/shop/orders/${orderId}`);
    return response.data;
  },

  // Reviews
  createReview: async (data: {
    productId: string;
    orderId: string;
    rating: number;
    title?: string;
    comment?: string;
    imageUrls?: string[];
  }) => {
    const response = await api.post('/api/shop/reviews', data);
    return response.data;
  },
};

// Events API endpoints
export const eventsAPI = {
  // Public events discovery
  getEvents: async (params?: {
    category?: string;
    search?: string;
    salonId?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const response = await api.get('/api/events', { params });
      return response.data;
    } catch (error) {
      console.warn('Events API not available, using sample data');
      return { success: true, events: [] };
    }
  },

  getEventById: async (eventId: string) => {
    try {
      const response = await api.get(`/api/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.warn('Event details API not available');
      return null;
    }
  },

  getEventCategories: async () => {
    try {
      const response = await api.get('/api/events/categories');
      return response.data;
    } catch (error) {
      return { success: true, categories: ['All', 'Workshops', 'Product Launch', 'Sales', 'Group Events', 'Celebrity'] };
    }
  },

  // User registrations
  getMyRegistrations: async (params?: {
    status?: 'upcoming' | 'attended' | 'cancelled';
    limit?: number;
    offset?: number;
  }) => {
    try {
      const response = await api.get('/api/events/my-registrations', { params });
      return response.data;
    } catch (error) {
      console.warn('Registrations API not available');
      return { success: true, registrations: [] };
    }
  },

  getRegistrationById: async (registrationId: string) => {
    try {
      const response = await api.get(`/api/events/registrations/${registrationId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Registration flow
  registerForEvent: async (data: {
    eventId: string;
    name: string;
    phone: string;
    email?: string;
    numberOfTickets: number;
    specialRequirements?: string;
  }) => {
    const response = await api.post('/api/events/register', data);
    return response.data;
  },

  // Payment for event
  createEventPaymentOrder: async (data: {
    eventId: string;
    registrationId: string;
    amount: number;
  }) => {
    const response = await api.post('/api/events/payment/create-order', data);
    return response.data;
  },

  verifyEventPayment: async (data: {
    registrationId: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => {
    const response = await api.post('/api/events/payment/verify', data);
    return response.data;
  },

  // Cancellation
  cancelRegistration: async (registrationId: string, data: {
    reason: string;
    reasonDetails?: string;
  }) => {
    const response = await api.post(`/api/events/registrations/${registrationId}/cancel`, data);
    return response.data;
  },

  getRefundEstimate: async (registrationId: string) => {
    try {
      const response = await api.get(`/api/events/registrations/${registrationId}/refund-estimate`);
      return response.data;
    } catch (error) {
      return { success: true, refundPercentage: 80, refundAmount: 0 };
    }
  },

  // Feedback/Reviews
  submitEventFeedback: async (registrationId: string, data: {
    ratings: Record<string, number>;
    comment?: string;
    photoUrls?: string[];
  }) => {
    const response = await api.post(`/api/events/registrations/${registrationId}/feedback`, data);
    return response.data;
  },

  getEventReviews: async (eventId: string, params?: {
    limit?: number;
    offset?: number;
  }) => {
    try {
      const response = await api.get(`/api/events/${eventId}/reviews`, { params });
      return response.data;
    } catch (error) {
      return { success: true, reviews: [] };
    }
  },
};

// Loyalty & Rewards API endpoints
export const loyaltyAPI = {
  getTiers: async () => {
    const response = await api.get('/api/mobile/loyalty/tiers');
    return response.data;
  },

  getPoints: async () => {
    const response = await api.get('/api/mobile/loyalty/points');
    return response.data;
  },

  getTransactions: async (params?: { limit?: number; offset?: number; type?: string }) => {
    const response = await api.get('/api/mobile/loyalty/transactions', { params });
    return response.data;
  },

  earnPoints: async (data: {
    points: number;
    source: string;
    referenceId?: string;
    referenceType?: string;
    description?: string;
  }) => {
    const response = await api.post('/api/mobile/loyalty/earn', data);
    return response.data;
  },

  getRewards: async (params?: { category?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/api/mobile/loyalty/rewards', { params });
    return response.data;
  },

  redeemReward: async (rewardId: string) => {
    const response = await api.post(`/api/mobile/loyalty/rewards/${rewardId}/redeem`);
    return response.data;
  },

  getMyRewards: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/api/mobile/loyalty/my-rewards', { params });
    return response.data;
  },
};

// Favorites API endpoints
export const favoritesAPI = {
  getFavoriteSalons: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/api/mobile/favorites/salons', { params });
    return response.data;
  },

  addFavoriteSalon: async (salonId: string) => {
    const response = await api.post(`/api/mobile/favorites/salons/${salonId}`);
    return response.data;
  },

  removeFavoriteSalon: async (salonId: string) => {
    const response = await api.delete(`/api/mobile/favorites/salons/${salonId}`);
    return response.data;
  },

  checkSalonFavorite: async (salonId: string) => {
    const response = await api.get(`/api/mobile/favorites/salons/${salonId}/check`);
    return response.data;
  },

  getFavoriteSalonIds: async () => {
    const response = await api.get('/api/mobile/favorites/salons/ids');
    return response.data;
  },

  getFavoriteStylists: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/api/mobile/favorites/stylists', { params });
    return response.data;
  },

  addFavoriteStylist: async (staffId: string) => {
    const response = await api.post(`/api/mobile/favorites/stylists/${staffId}`);
    return response.data;
  },

  removeFavoriteStylist: async (staffId: string) => {
    const response = await api.delete(`/api/mobile/favorites/stylists/${staffId}`);
    return response.data;
  },

  checkStylistFavorite: async (staffId: string) => {
    const response = await api.get(`/api/mobile/favorites/stylists/${staffId}/check`);
    return response.data;
  },

  getFavoritesCount: async () => {
    const response = await api.get('/api/mobile/favorites/count');
    return response.data;
  },
};

// Referral API endpoints
export const referralAPI = {
  getMyCode: async () => {
    const response = await api.get('/api/mobile/referrals/my-code');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/api/mobile/referrals/stats');
    return response.data;
  },

  getHistory: async (params?: { limit?: number; offset?: number }) => {
    const response = await api.get('/api/mobile/referrals/history', { params });
    return response.data;
  },

  validateCode: async (code: string) => {
    const response = await api.post('/api/mobile/referrals/validate', { code });
    return response.data;
  },

  applyCode: async (code: string) => {
    const response = await api.post('/api/mobile/referrals/apply', { code });
    return response.data;
  },

  completeReferral: async (referralId: string, bookingId: string) => {
    const response = await api.post(`/api/mobile/referrals/complete/${referralId}`, { bookingId });
    return response.data;
  },
};

// Appointments/Bookings API endpoints
export const appointmentsAPI = {
  getAppointments: async (params?: {
    status?: 'upcoming' | 'completed' | 'cancelled';
    limit?: number;
    offset?: number;
  }) => {
    try {
      const response = await api.get('/api/bookings', { params });
      return response.data;
    } catch (error) {
      console.warn('Appointments API not available');
      return { success: true, bookings: [] };
    }
  },

  getAppointmentById: async (appointmentId: string) => {
    try {
      const response = await api.get(`/api/mobile/bookings/${appointmentId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  createAppointment: async (data: {
    salonId: string;
    serviceIds: string[];
    staffId?: string;
    date: string;
    time: string;
    serviceType: 'salon' | 'home';
    address?: string;
    notes?: string;
  }) => {
    const response = await api.post('/api/mobile/bookings', data);
    return response.data;
  },

  rescheduleAppointment: async (appointmentId: string, data: {
    date: string;
    time: string;
  }) => {
    const response = await api.patch(`/api/mobile/bookings/${appointmentId}/reschedule`, data);
    return response.data;
  },

  cancelAppointment: async (appointmentId: string, data: {
    reason: string;
  }) => {
    const response = await api.post(`/api/mobile/bookings/${appointmentId}/cancel`, data);
    return response.data;
  },

  submitAppointmentReview: async (appointmentId: string, data: {
    rating: number;
    comment?: string;
  }) => {
    const response = await api.post(`/api/mobile/bookings/${appointmentId}/review`, data);
    return response.data;
  },
};

// Rebooking API endpoints
export const rebookingAPI = {
  getSuggestions: async (salonId?: string) => {
    try {
      const response = await api.get('/api/mobile/rebooking/suggestions', {
        params: salonId ? { salonId } : {},
      });
      return response.data;
    } catch (error) {
      console.warn('Rebooking suggestions API not available');
      return [];
    }
  },

  dismissSuggestion: async (data: {
    serviceId: string;
    salonId: string;
    reason?: string;
    snoozeDays?: number;
  }) => {
    const response = await api.post('/api/mobile/rebooking/dismiss', data);
    return response.data;
  },
};

// Deposit API endpoints for No-Show Protection
export interface DepositCheckResult {
  requiresDeposit: boolean;
  reason: string;
  totalDepositPaisa: number;
  totalServicePaisa: number;
  balanceDuePaisa?: number;
  forceFullPayment?: boolean;
  serviceDeposits: Array<{
    serviceId: string;
    serviceName: string;
    servicePriceInPaisa: number;
    depositAmountPaisa: number;
    depositPercentage: number;
    requiresDeposit: boolean;
    reason: string;
  }>;
  cancellationPolicy?: {
    windowHours: number;
    withinWindowAction: string;
    partialForfeitPercentage?: number;
    noShowAction: string;
    noShowGraceMinutes?: number;
    policyText?: string;
  } | null;
}

export interface DepositOrder {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
}

export interface DepositTransaction {
  id: string;
  salonId: string;
  salonName?: string;
  bookingId: string;
  transactionType: 'deposit_collected' | 'deposit_refunded' | 'deposit_forfeited' | 'no_show_charged' | 'deposit_applied';
  amountPaisa: number;
  currency: string;
  serviceAmountPaisa: number;
  depositPercentage: number;
  status: string;
  reason?: string;
  wasNoShow?: number;
  createdAt: string;
  bookingDate?: string;
  bookingTime?: string;
  serviceName?: string;
}

export const depositAPI = {
  checkBookingDeposit: async (data: {
    salonId: string;
    serviceIds: string[];
    customerId?: string;
  }): Promise<DepositCheckResult> => {
    try {
      const response = await api.post('/api/mobile/deposits/check-booking-deposit', data);
      return response.data;
    } catch (error) {
      console.warn('Deposit check failed, assuming no deposit required');
      return {
        requiresDeposit: false,
        reason: 'api_error',
        totalDepositPaisa: 0,
        totalServicePaisa: 0,
        serviceDeposits: [],
      };
    }
  },

  getCancellationPolicy: async (salonId: string) => {
    try {
      const response = await api.get(`/api/mobile/deposits/cancellation-policy/${salonId}`);
      return response.data;
    } catch (error) {
      return null;
    }
  },

  createDepositOrder: async (data: {
    salonId: string;
    serviceIds: string[];
    amountPaisa: number;
    paymentType: 'deposit' | 'full_payment';
    customerEmail?: string;
    customerPhone?: string;
    bookingDate: string;
    bookingTime: string;
    staffId?: string | null;
  }): Promise<{ success: boolean; order: DepositOrder; keyId: string; salonName: string; serviceNames: string[] }> => {
    const response = await api.post('/api/deposits/create-deposit-order', data);
    return response.data;
  },

  verifyDepositPayment: async (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    salonId: string;
    serviceIds: string[];
    bookingDate: string;
    bookingTime: string;
    staffId?: string | null;
    customerEmail: string;
    customerPhone?: string;
    customerName?: string;
    paymentType: 'deposit' | 'full_payment';
  }) => {
    const response = await api.post('/api/deposits/verify-deposit-payment', data);
    return response.data;
  },

  getMyDeposits: async (): Promise<{ transactions: DepositTransaction[]; stats: any }> => {
    try {
      const response = await api.get('/api/mobile/deposits/my-deposits');
      return response.data;
    } catch (error) {
      return { transactions: [], stats: {} };
    }
  },
};

// Gift Card API endpoints
import type {
  GiftCardTemplate,
  GiftCard,
  GiftCardTransaction,
  PurchaseGiftCardData,
  CreateOrderResponse,
  VerifyPaymentData,
  ValidateGiftCardResponse,
  MyCardsResponse,
} from '../types/giftCard';

export const giftCardAPI = {
  getTemplates: async (salonId: string): Promise<{ templates: GiftCardTemplate[] }> => {
    const response = await api.get(`/api/gift-cards/public/templates/${salonId}`);
    return response.data;
  },

  createOrder: async (data: PurchaseGiftCardData): Promise<CreateOrderResponse> => {
    const response = await api.post('/api/gift-cards/public/create-order', data);
    return response.data;
  },

  verifyPayment: async (data: VerifyPaymentData): Promise<{ success: boolean; giftCard: GiftCard }> => {
    const response = await api.post('/api/gift-cards/public/verify-payment', data);
    return response.data;
  },

  validateCard: async (code: string, salonId?: string): Promise<ValidateGiftCardResponse> => {
    const response = await api.post('/api/gift-cards/public/validate', { code, salonId });
    return response.data;
  },

  getMyCards: async (): Promise<MyCardsResponse> => {
    const response = await api.get('/api/gift-cards/my-cards');
    return response.data;
  },

  getTransactions: async (giftCardId: string): Promise<{ transactions: GiftCardTransaction[] }> => {
    const response = await api.get(`/api/gift-cards/${giftCardId}/transactions`);
    return response.data;
  },

  applyToBooking: async (data: {
    code: string;
    salonId: string;
    amountPaisa: number;
  }): Promise<{ success: boolean; appliedAmountPaisa: number; remainingBalancePaisa: number }> => {
    const response = await api.post('/api/gift-cards/apply-to-booking', data);
    return response.data;
  },
};

// Beauty Profile API endpoints
export interface BeautyProfile {
  id: string;
  salonId: string;
  salonName: string;
  salonImageUrl?: string;
  hairType?: string;
  hairTexture?: string;
  hairColor?: string;
  skinType?: string;
  skinTone?: string;
  skinConcerns?: string[];
  allergies?: string[];
  preferredCommunication?: string;
  preferredBeverage?: string;
  musicPreference?: string;
  additionalNotes?: string;
  photos?: {
    id: string;
    url: string;
    caption?: string;
    createdAt: string;
  }[];
  notes?: {
    id: string;
    content: string;
    createdBy: string;
    createdAt: string;
    isPrivate: boolean;
  }[];
  visitCount: number;
  lastVisit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BeautyProfileSummary {
  totalProfiles: number;
  totalPhotos: number;
  totalNotes: number;
  totalVisits: number;
  lastActiveAt?: string;
}

export interface BookingSummary {
  hairProfile?: {
    type?: string;
    texture?: string;
    color?: string;
  };
  skinProfile?: {
    type?: string;
    tone?: string;
    concerns?: string[];
  };
  allergies?: string[];
  preferences?: {
    communication?: string;
    beverage?: string;
    music?: string;
  };
  additionalNotes?: string;
}

export interface LateNotificationInput {
  bookingId: string;
  estimatedDelayMinutes: number;
  customerMessage?: string;
}

export interface DelayOption {
  value: number;
  label: string;
}

export const lateArrivalAPI = {
  getDelayOptions: async (): Promise<{
    success: boolean;
    options: DelayOption[];
    error?: string;
  }> => {
    try {
      const response = await api.get('/api/mobile/late-arrival/delay-options');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch delay options:', error);
      return {
        success: false,
        options: [],
        error: error?.response?.data?.error || 'Failed to load delay options',
      };
    }
  },

  canNotify: async (bookingId: string): Promise<{
    success: boolean;
    canSend: boolean;
    reason?: string;
    booking?: any;
    error?: string;
  }> => {
    try {
      const response = await api.get(`/api/mobile/late-arrival/bookings/${bookingId}/can-notify`);
      return { success: true, ...response.data };
    } catch (error: any) {
      console.error('Failed to check late notification eligibility:', error);
      return {
        success: false,
        canSend: false,
        error: error?.response?.data?.error || 'Failed to check eligibility',
      };
    }
  },

  sendNotification: async (data: LateNotificationInput): Promise<{
    success: boolean;
    message?: string;
    notification?: any;
    error?: string;
  }> => {
    try {
      const response = await api.post('/api/mobile/late-arrival/notify', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to send late notification:', error);
      return {
        success: false,
        error: error?.response?.data?.error || 'Failed to send notification',
      };
    }
  },

  getHistory: async (): Promise<{
    success: boolean;
    notifications: any[];
    error?: string;
  }> => {
    try {
      const response = await api.get('/api/mobile/late-arrival/customer/history');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch notification history:', error);
      return {
        success: false,
        notifications: [],
        error: error?.response?.data?.error || 'Failed to load history',
      };
    }
  },
};

export interface DeparturePreferences {
  receiveAlerts: boolean;
  defaultLocationLabel: 'home' | 'office' | 'ask_each_time';
  preferredBufferMinutes: number;
  reminderTimingPreference: '30_minutes' | '60_minutes' | '90_minutes' | '2_hours';
  preferredChannel: 'push' | 'sms' | 'whatsapp' | 'all';
  quietHoursStart?: string;
  quietHoursEnd?: string;
}

export interface DepartureStatus {
  bookingId: string;
  alertId?: string;
  originalTime: string;
  predictedStartTime: string;
  delayMinutes: number;
  delayReason?: string;
  suggestedDeparture: {
    time: string;
    fromLocation?: string;
    estimatedTravelMinutes?: number;
    bufferMinutes: number;
  };
  staffStatus?: {
    name: string;
    currentStatus: string;
    appointmentsAhead: number;
  };
  lastUpdated: string;
}

export const departureAPI = {
  getPreferences: async (): Promise<{
    success: boolean;
    preferences: DeparturePreferences | null;
    error?: string;
  }> => {
    try {
      const response = await api.get('/api/mobile/departure-alerts/preferences');
      const data = response.data;
      if (data.success && data.preferences) {
        return { success: true, preferences: data.preferences };
      }
      return { success: data.success ?? true, preferences: data.preferences ?? data };
    } catch (error: any) {
      console.error('Failed to fetch departure preferences:', error);
      return { 
        success: false, 
        preferences: null,
        error: error?.response?.data?.error || 'Failed to load preferences',
      };
    }
  },

  updatePreferences: async (preferences: Partial<DeparturePreferences>): Promise<{
    success: boolean;
    preferences?: DeparturePreferences;
    error?: string;
  }> => {
    try {
      const response = await api.put('/api/mobile/departure-alerts/preferences', preferences);
      const data = response.data;
      if (data.success === false) {
        return { success: false, error: data.error || 'Failed to update preferences' };
      }
      return { success: true, preferences: data.preferences ?? data };
    } catch (error: any) {
      console.error('Failed to update departure preferences:', error);
      return {
        success: false,
        error: error?.response?.data?.error || 'Failed to update preferences',
      };
    }
  },

  getDepartureStatus: async (bookingId: string): Promise<{
    success: boolean;
    status?: DepartureStatus;
    error?: string;
  }> => {
    try {
      const response = await api.get(`/api/mobile/departure-alerts/departure-status/${bookingId}`);
      const data = response.data;
      if (data.success === false) {
        return { success: false, error: data.error || 'Failed to load departure status' };
      }
      return { success: true, status: data.status ?? data };
    } catch (error: any) {
      console.error('Failed to fetch departure status:', error);
      return {
        success: false,
        error: error?.response?.data?.error || 'Failed to load departure status',
      };
    }
  },

  acknowledgeAlert: async (alertId: string, responseData: {
    response: 'acknowledged' | 'will_be_late' | 'reschedule' | 'cancel';
    actualDepartureTime?: string;
  }): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const response = await api.post(`/api/mobile/departure-alerts/alerts/${alertId}/acknowledge`, responseData);
      const data = response.data;
      if (data.success === false) {
        return { success: false, error: data.error || 'Failed to acknowledge' };
      }
      return { success: true };
    } catch (error: any) {
      console.error('Failed to acknowledge departure alert:', error);
      return {
        success: false,
        error: error?.response?.data?.error || 'Failed to acknowledge',
      };
    }
  },
};

export const beautyProfileAPI = {
  getMyBeautyProfile: async (): Promise<{
    success: boolean;
    profiles: BeautyProfile[];
    summary: BeautyProfileSummary;
  }> => {
    const response = await api.get('/api/client-profiles/my-beauty-profile');
    return response.data;
  },

  updateBeautyProfile: async (
    profileId: string,
    data: Partial<BeautyProfile>
  ): Promise<{ success: boolean; profile: BeautyProfile }> => {
    const response = await api.put(`/api/client-profiles/my-beauty-profile/${profileId}`, data);
    return response.data;
  },

  getBookingSummary: async (salonId: string): Promise<{
    success: boolean;
    summary: BookingSummary;
  }> => {
    const response = await api.get(`/api/client-profiles/booking-summary/${salonId}`);
    return response.data;
  },
};

export interface MembershipPlanAPI {
  id: string;
  salonId: string;
  name: string;
  description: string | null;
  planType: 'discount' | 'credit' | 'packaged';
  durationMonths: number;
  priceInPaisa: number;
  billingType: 'one_time' | 'monthly';
  monthlyPriceInPaisa: number | null;
  discountPercentage: number | null;
  creditAmountInPaisa: number | null;
  bonusPercentage: number | null;
  priorityBooking: number;
  isActive: number;
  includedServices?: {
    id: string;
    serviceId: string;
    quantityPerMonth: number;
    isUnlimited: number;
    serviceName: string;
    servicePrice: number;
  }[];
}

export interface CustomerMembershipAPI {
  id: string;
  planId: string;
  customerId: string;
  salonId: string;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  startDate: string;
  endDate: string;
  pausedAt: string | null;
  resumedAt: string | null;
  cancelledAt: string | null;
  remainingCreditsInPaisa: number | null;
  createdAt: string;
  plan: MembershipPlanAPI;
  salon: {
    id: string;
    name: string;
    imageUrl?: string;
  };
  serviceUsage?: {
    serviceId: string;
    serviceName: string;
    usedThisMonth: number;
    quantityPerMonth: number;
    isUnlimited: number;
  }[];
}

export interface MembershipBenefitsResponse {
  hasActiveMembership: boolean;
  membershipId?: string;
  planType?: string;
  discountPercentage?: number;
  originalTotal: number;
  discountedTotal: number;
  savings: number;
  creditApplied?: number;
  remainingCredits?: number;
}

export const membershipAPI = {
  getAvailablePlans: async (salonId: string): Promise<{
    success: boolean;
    plans: MembershipPlanAPI[];
  }> => {
    try {
      const response = await api.get(`/api/salons/${salonId}/memberships/available`);
      return response.data;
    } catch (error) {
      console.warn('Membership plans not available');
      return { success: true, plans: [] };
    }
  },

  purchaseMembership: async (planId: string): Promise<{
    success: boolean;
    membership?: CustomerMembershipAPI;
    error?: string;
  }> => {
    try {
      const response = await api.post('/api/memberships/purchase', { planId });
      return response.data;
    } catch (error: any) {
      console.error('Error purchasing membership:', error);
      const errorMessage = error.response?.data?.message || 'Failed to purchase membership';
      error.message = errorMessage;
      throw error;
    }
  },

  getMyMemberships: async (): Promise<{
    success: boolean;
    memberships: CustomerMembershipAPI[];
  }> => {
    try {
      const response = await api.get('/api/my/memberships');
      return response.data;
    } catch (error) {
      console.warn('My memberships not available');
      return { success: true, memberships: [] };
    }
  },

  getMembershipDetails: async (membershipId: string): Promise<{
    success: boolean;
    membership?: CustomerMembershipAPI;
    error?: string;
  }> => {
    try {
      const response = await api.get(`/api/my/memberships/${membershipId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error getting membership details:', error);
      const errorMessage = error.response?.data?.message || 'Failed to get membership details';
      error.message = errorMessage;
      throw error;
    }
  },

  pauseMembership: async (membershipId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const response = await api.post(`/api/my/memberships/${membershipId}/pause`);
      return response.data;
    } catch (error: any) {
      console.error('Error pausing membership:', error);
      const errorMessage = error.response?.data?.message || 'Failed to pause membership';
      error.message = errorMessage;
      throw error;
    }
  },

  resumeMembership: async (membershipId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const response = await api.post(`/api/my/memberships/${membershipId}/resume`);
      return response.data;
    } catch (error: any) {
      console.error('Error resuming membership:', error);
      const errorMessage = error.response?.data?.message || 'Failed to resume membership';
      error.message = errorMessage;
      throw error;
    }
  },

  cancelMembership: async (membershipId: string): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const response = await api.post(`/api/my/memberships/${membershipId}/cancel`);
      return response.data;
    } catch (error: any) {
      console.error('Error cancelling membership:', error);
      const errorMessage = error.response?.data?.message || 'Failed to cancel membership';
      error.message = errorMessage;
      throw error;
    }
  },

  calculateBenefits: async (salonId: string, serviceIds: string[]): Promise<{
    success: boolean;
    benefits?: MembershipBenefitsResponse;
    error?: string;
  }> => {
    try {
      const response = await api.post(`/api/salons/${salonId}/calculate-membership-benefits`, { serviceIds });
      return response.data;
    } catch (error) {
      return { success: false, error: 'Failed to calculate benefits' };
    }
  },
};
