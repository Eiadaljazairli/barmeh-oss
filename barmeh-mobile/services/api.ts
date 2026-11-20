import axios, { AxiosError } from 'axios';
import { DeviceEventEmitter } from 'react-native';
import * as SecureStore from '../utils/storage';
import Constants from 'expo-constants';

export const AUTH_INVALIDATED_EVENT = 'auth:invalidated';

const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  'http://localhost:3000/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await SecureStore.getItemAsync('userRefreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;

          await SecureStore.setItemAsync('userToken', accessToken);
          await SecureStore.setItemAsync('userRefreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userRefreshToken');
        await SecureStore.deleteItemAsync('userInfo');
        try { DeviceEventEmitter.emit(AUTH_INVALIDATED_EVENT); } catch {}
      }
    }
    return Promise.reject(error);
  },
);

export const authService = {
  requestEmailOtp: async (email: string, isLogin?: boolean) => {
    const { data } = await api.post('/auth/request-email-otp', { email, isLogin });
    return data;
  },

  preVerifyEmailOtp: async (email: string, otp: string) => {
    const { data } = await api.post('/auth/pre-verify-email', { email, otp });
    return data;
  },

  verifyOtp: async (
    email: string,
    otp: string,
    firstName: string,
    lastName: string,
    age: number | undefined,
    gender: string,
    governorate: string,
    userType?: 'MERCHANT' | 'CONSUMER',
  ) => {
    const response = await api.post('/auth/verify-otp', {
      email,
      otp,
      firstName,
      lastName,
      age,
      gender,
      governorate,
      userType,
    });
    const data = response.data as {
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        firstName?: string;
        lastName?: string;
        trustScore: number;
        email?: string;
        avatarUrl?: string;
        isAdmin: boolean;
        userType: string;
      };
    };
    await SecureStore.setItemAsync('userToken', data.accessToken);
    await SecureStore.setItemAsync('userRefreshToken', data.refreshToken);
    await SecureStore.setItemAsync('userInfo', JSON.stringify(data.user));
    return data;
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userRefreshToken');
    await SecureStore.deleteItemAsync('userInfo');
  },

  getCurrentUser: async () => {
    const raw = await SecureStore.getItemAsync('userInfo');
    return raw ? (JSON.parse(raw) as { id: string; trustScore: number; isAdmin: boolean; trustLevel?: string }) : null;
  },

  googleLogin: async (idToken: string) => {
    const response = await api.post('/auth/google-login', { idToken });
    const data = response.data as {
      accessToken: string;
      refreshToken: string;
      user: {
        id: string;
        name?: string;
        trustScore: number;
        email?: string;
        avatarUrl?: string;
        isAdmin: boolean;
        userType: string;
        trustLevel: string;
      };
    };
    await SecureStore.setItemAsync('userToken', data.accessToken);
    await SecureStore.setItemAsync('userRefreshToken', data.refreshToken);
    await SecureStore.setItemAsync('userInfo', JSON.stringify(data.user));
    return data;
  },

  isAuthenticated: async () => !!(await SecureStore.getItemAsync('userToken')),

  getPublicProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}/public`);
    return response.data as {
      id: string;
      name: string;
      avatarUrl?: string;
      trustScore: number;
      trustLevel?: string;
      createdAt?: string;
    };
  },
};

export type City =
  | 'DAMASCUS'
  | 'RURAL_DAMASCUS'
  | 'ALEPPO'
  | 'HOMS'
  | 'HAMA'
  | 'LATAKIA'
  | 'TARTUS'
  | 'IDLIB'
  | 'DEIR_EZ_ZOR'
  | 'RAQQA'
  | 'HASAKAH'
  | 'DARAA'
  | 'SUWAYDA'
  | 'QUNEITRA'
  | 'QAMISHLI';

export interface ListingFilters {
  q?: string;
  city?: City;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: 'NEW' | 'USED';
  lat?: number;
  lng?: number;
  distance?: number;
  cursor?: string;
  limit?: number;
  sortBy?: 'LATEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'POPULAR';
  priceStatus?: 'FREE' | 'NEGOTIABLE' | 'FIXED';
  attributes?: Record<string, string>;
}

export interface ListingImage {
  id?: string;
  thumbUrl: string;
  mediumUrl: string;
}

export interface ListingSummary {
  id: string;
  title: string;
  price: number;
  currency?: 'SYP' | 'USD' | 'TRY' | 'EUR';
  city: City;
  categoryId?: string;
  createdAt?: string;
  images?: ListingImage[];
  attributes?: Record<string, string | number | boolean>;
    user?: {
      id: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      avatarUrl?: string;
      trustLevel: 'NEWBIE' | 'VERIFIED' | 'TRUSTED' | 'VIP';
      trustScore?: number;
      userType?: string;
    };
  latitude?: number;
  longitude?: number;
  likesCount?: number;
  promotion?: {
    type: 'TOP_PLACEMENT' | 'FEATURED' | 'URGENT';
    expiresAt: string;
  } | null;
}

export interface ListingsPage {
  items: ListingSummary[];
  nextCursor: string | null;
}

export const listingService = {
  getListings: async (filters: ListingFilters = {}): Promise<ListingsPage> => {
    const { attributes, ...rest } = filters;
    const params: any = { ...rest };
    if (attributes && Object.keys(attributes).length > 0) {
      params.attributes = JSON.stringify(attributes);
    }
    const response = await api.get('/listings', { params });
    const raw = response.data;
    if (Array.isArray(raw)) return { items: raw, nextCursor: null };
    return {
      items: Array.isArray(raw?.items) ? raw.items : [],
      nextCursor: raw?.nextCursor ?? null,
    };
  },

  getListingDetails: async (id: string) => {
    const response = await api.get(`/listings/${id}`);
    return response.data;
  },

  getListingContact: async (id: string) => {
    const response = await api.get(`/listings/${id}/contact`);
    return response.data as { sellerId: string };
  },

  createListing: async (data: {
    title: string;
    description: string;
    price: number;
    city: City;
    categoryId: string;
    discount?: boolean;
    discountPercentage?: number;
    priceStatus?: 'negotiable' | 'fixed' | 'free';
    attributes?: Record<string, string | number | boolean>;
  }) => {
    const response = await api.post('/listings', data);
    return response.data as { id: string; [key: string]: any };
  },

  updateListing: async (id: string, data: Partial<{
    title: string;
    description: string;
    price: number;
    city: City;
    categoryId: string;
    discount: boolean;
    discountPercentage: number;
    priceStatus: 'negotiable' | 'fixed' | 'free';
    attributes: Record<string, string | number | boolean>;
  }>) => {
    const response = await api.patch(`/listings/${id}`, data);
    return response.data;
  },

  uploadImage: async (listingId: string, imageUri: string) => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() ?? `image_${Date.now()}.jpg`;
    const ext = (filename.split('.').pop() ?? 'jpg').toLowerCase();
    const type = `image/${ext === 'jpg' ? 'jpeg' : ext}`;

    formData.append('file', { uri: imageUri, name: filename, type } as any);

    const response = await api.post(`/images/upload/${listingId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return response.data as { thumbUrl: string; mediumUrl: string; hash: string };
  },

  reportListing: async (listingId: string, reason: string) => {
    const response = await api.post(`/listings/${listingId}/report`, { reason });
    return response.data;
  },

  toggleFavorite: async (listingId: string) => {
    const response = await api.post(`/listings/${listingId}/favorite`);
    return response.data as { favorited: boolean };
  },

  getPurchases: async (): Promise<ListingSummary[]> => {
    const response = await api.get('/listings/purchases/me');
    return Array.isArray(response.data) ? response.data : [];
  },

  togglePurchase: async (listingId: string) => {
    const response = await api.post(`/listings/${listingId}/purchase`);
    return response.data as { purchased: boolean };
  },

  getFavorites: async (): Promise<ListingSummary[]> => {
    const response = await api.get('/listings/favorites/me');
    return Array.isArray(response.data) ? response.data : [];
  },

  getMyListings: async (): Promise<ListingSummary[]> => {
    const response = await api.get('/listings/me');
    return Array.isArray(response.data) ? response.data : [];
  },

  getListingsByUserId: async (userId: string): Promise<ListingSummary[]> => {
    const response = await api.get(`/listings/user/${userId}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  getCategories: async () => {
    const response = await api.get('/categories');
    return response.data as {
      id: string;
      slug: string;
      nameAr: string;
      nameEn: string;
      icon: string;
      order: number;
      parentId?: string | null;
      _count?: { listings: number };
    }[];
  },

  getSubcategories: async (categoryId: string) => {
    const response = await api.get(`/categories/${categoryId}/children`);
    return response.data as {
      id: string;
      slug: string;
      nameAr: string;
      icon: string;
      _count?: { listings: number };
    }[];
  },

  deleteListing: async (id: string) => {
    const response = await api.post(`/listings/${id}/delete`);
    return response.data as { success: boolean; message: string };
  },

  requestBooking: async (id: string) => {
    const response = await api.post(`/listings/${id}/book`);
    return response.data as { success: boolean; message: string };
  },

  getBooking: async (bookingId: string): Promise<Booking> => {
    const response = await api.get(`/listings/bookings/${bookingId}`);
    return response.data;
  },

  acceptBooking: async (bookingId: string) => {
    const response = await api.post(`/listings/bookings/${bookingId}/accept`);
    return response.data as Booking;
  },

  rejectBooking: async (bookingId: string) => {
    const response = await api.post(`/listings/bookings/${bookingId}/reject`);
    return response.data as Booking;
  },

  cancelBooking: async (bookingId: string) => {
    const response = await api.post(`/listings/bookings/${bookingId}/cancel`);
    return response.data as Booking;
  },

  getMyBookingForListing: async (id: string) => {
    const response = await api.get(`/listings/${id}/my-booking`);
    return response.data as { booking: Booking | null };
  },

  getMyBookings: async (): Promise<MyBooking[]> => {
    const response = await api.get(`/listings/bookings/me`);
    return response.data;
  },
};

export type BookingStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface Booking {
  id: string;
  listingId: string;
  requesterId: string;
  sellerId: string;
  status: BookingStatus;
  createdAt: string;
  respondedAt: string | null;
  listing?: { id: string; title: string };
  requester?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface MyBooking {
  id: string;
  listingId: string;
  requesterId: string;
  sellerId: string;
  status: BookingStatus;
  createdAt: string;
  respondedAt: string | null;
  listing?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    status: string;
    images?: { thumbUrl: string | null; mediumUrl: string | null }[];
  };
  seller?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
}

export interface ChatSummary {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  listing?: {
    id: string;
    title: string;
    image?: string;
  } | null;
  lastMessage: { content: string; createdAt: string; senderId: string } | null;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  readAt: string | null;
  createdAt: string;
  sender?: {
    id: string;
    firstName: string;
    avatarUrl?: string | null;
  };
}

export const chatService = {
  getMyChats: async (isArchived: boolean = false): Promise<ChatSummary[]> => {
    const response = await api.get('/chats', { params: { archived: isArchived } });
    return Array.isArray(response.data) ? response.data : [];
  },

  getHistory: async (otherUserId: string, listingId?: string): Promise<{
    id?: string;
    messages: ChatMessage[];
    listing?: {
      id: string;
      title: string;
      price: number;
      images: { thumbUrl: string }[];
    };
  }> => {
    const response = await api.get(`/chats/${otherUserId}`, {
      params: { listingId }
    });
    return response.data ?? { messages: [] };
  },

  sendMessage: async (otherUserId: string, content: string, listingId?: string): Promise<ChatMessage> => {
    const response = await api.post(`/chats/${otherUserId}/messages`, { content, listingId });
    return response.data;
  },

  markAsRead: async (chatId: string): Promise<void> => {
    await api.post(`/chats/${chatId}/read`);
  },

  deleteMessageForMe: async (messageId: string): Promise<void> => {
    await api.post(`/chats/messages/${messageId}/delete-for-me`);
  },

  archiveChat: async (chatId: string): Promise<void> => {
    await api.post(`/chats/${chatId}/archive`);
  },

  unarchiveChat: async (chatId: string): Promise<void> => {
    await api.post(`/chats/${chatId}/unarchive`);
  },
};

export interface UserMe {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  name?: string;
  username?: string;
  avatarUrl?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  governorate?: City;
  userType: 'MERCHANT' | 'CONSUMER';
  merchantProfile?: MerchantProfile;
  trustScore: number;
  trustLevel: 'NEWBIE' | 'VERIFIED' | 'TRUSTED' | 'VIP';
  isAdmin: boolean;
  isEmailVerified?: boolean;
  createdAt: string;
  _count: { listings: number; favorites: number };
}

export const usersService = {
  getMe: async (): Promise<UserMe> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  getMeStats: async (): Promise<{
    activeListings: number;
    unreadMessages: number;
    reviewsCount: number;
    averageRating: number;
  }> => {
    const response = await api.get('/users/me/stats');
    return response.data;
  },

  updateProfile: async (id: string, data: Partial<UserMe>) => {
    const response = await api.post('/users/me', data);
    return response.data;
  },

  updateLocation: async (lat: number, lng: number) => {
    const response = await api.post('/users/me/location', { lat, lng });
    return response.data;
  },

  uploadAvatar: async (uri: string) => {
    const formData = new FormData();
    const filename = uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;

    formData.append('file', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await api.post('/images/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAccount: async (): Promise<void> => {
    await api.delete('/users/me');
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userRefreshToken');
    await SecureStore.deleteItemAsync('userInfo');
  },

  reportUser: async (userId: string, reason: string) => {
    const response = await api.post(`/users/${userId}/report`, { reason });
    return response.data;
  },

  blockUser: async (userId: string) => {
    const response = await api.post(`/users/${userId}/block`);
    return response.data;
  },

  unblockUser: async (userId: string) => {
    const response = await api.post(`/users/${userId}/unblock`);
    return response.data;
  },

  getBlockedUsers: async () => {
    const response = await api.get('/users/blocks');
    return response.data as { id: string; name: string; avatarUrl?: string }[];
  },
};

export const supportService = {
  createTicket: async (data: { subject: string; description: string; city?: City; attachments?: { fileUrl: string, fileType: string }[] }) => {
    const response = await api.post('/users/support', data);
    return response.data;
  },

  replyToTicket: async (ticketId: string, data: { content: string; attachments?: { fileUrl: string, fileType: string }[] }) => {
    const response = await api.post(`/users/support/${ticketId}/reply`, data);
    return response.data;
  },

  escalateToPolice: async (ticketId: string) => {
    const response = await api.post(`/users/support/${ticketId}/escalate`);
    return response.data;
  },
};

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: 'INFO' | 'PROMO' | 'MESSAGE' | 'LISTING_UPDATE' | 'SYSTEM' | 'BOOKING';
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get('/notifications');
    return Array.isArray(response.data) ? response.data : [];
  },

  markAsRead: async (id: string) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  deleteAll: async () => {
    const response = await api.delete('/notifications');
    return response.data;
  },

  savePushToken: async (token: string) => {
    const response = await api.post('/users/push-token', { token });
    return response.data;
  },

  deletePushToken: async (token?: string) => {
    const response = await api.delete('/users/push-token', {
      data: token ? { token } : {},
    });
    return response.data;
  },

  getPreferences: async () => {
    const response = await api.get('/users/preferences');
    return response.data;
  },

  updatePreferences: async (data: any) => {
    const response = await api.post('/users/preferences', data);
    return response.data;
  },
};

export const savedSearchService = {
  create: async (data: { query?: string; filters?: any }) => {
    const response = await api.post('/saved-searches', data);
    return response.data;
  },

  findAll: async () => {
    const response = await api.get('/saved-searches');
    return response.data;
  },

  remove: async (id: string) => {
    const response = await api.delete(`/saved-searches/${id}`);
    return response.data;
  },
};
export interface Review {
  id: string;
  reviewerId: string;
  reviewedUserId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer: {
    id: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  };
}

export interface ReviewStats {
  reviews: Review[];
  average: number;
  count: number;
}

export const reviewService = {
  createReview: async (data: { reviewedUserId: string; rating: number; comment?: string }) => {
    const response = await api.post('/reviews', data);
    return response.data as Review;
  },

  getUserReviews: async (userId: string): Promise<ReviewStats> => {
    const response = await api.get(`/reviews/user/${userId}`);
    return response.data as ReviewStats;
  },
};

export interface MerchantProfile {
  id: string;
  userId: string;
  storeName: string;
  storeAddress?: string;
  taxId?: string;
  businessHours?: any;
  logoUrl?: string;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const merchantService = {
  upgrade: async (data: { storeName: string; storeAddress?: string; taxId?: string; businessHours?: any; logoUrl?: string }) => {
    const response = await api.post('/merchant/upgrade', data);
    return response.data as MerchantProfile;
  },

  getMyProfile: async () => {
    const response = await api.get('/merchant/me');
    return response.data as MerchantProfile;
  },

  updateProfile: async (data: Partial<MerchantProfile>) => {
    const response = await api.put('/merchant/me', data);
    return response.data as MerchantProfile;
  },
};

export const paymentService = {
  getProducts: async () => {
    const { data } = await api.get('/payments/products');
    return data;
  },

  checkout: async (listingId: string, productId: string, paymentMethod: string) => {
    const { data } = await api.post('/payments/checkout', {
      listingId,
      productId,
      paymentMethod,
    });
    return data;
  },

  getMyTransactions: async () => {
    const { data } = await api.get('/payments/my-transactions');
    return data;
  },

  getPromotionStatus: async (listingId: string) => {
    const { data } = await api.get(`/payments/promotion-status/${listingId}`);
    return data;
  },
};
