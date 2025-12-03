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
  }) => {
    const response = await api.post('/api/bookings', bookingData);
    return response.data;
  },

  getBookingById: async (bookingId: string) => {
    const response = await api.get(`/api/bookings/${bookingId}`);
    return response.data;
  },

  getUserBookings: async (params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await api.get('/api/bookings/my-bookings', { params });
    return response.data;
  },

  cancelBooking: async (bookingId: string, reason?: string) => {
    const response = await api.post(`/api/bookings/${bookingId}/cancel`, { reason });
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
