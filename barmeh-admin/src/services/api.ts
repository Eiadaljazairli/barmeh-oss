import axios from 'axios';

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    return window.location.hostname === 'localhost'
      ? 'http://localhost:3001/v1'
      : 'http://localhost:3000/v1';
  }
  return 'http://localhost:3000/v1';
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  getUserCount: () => api.get('/users/admin/count'),
  getListingCount: () => api.get('/listings/admin/count'),
  getSupportCount: () => api.get('/users/admin/support-count'),
  getReportCount: () => api.get('/reports/admin/count'),

  getListings: () => api.get('/listings/admin/list'),
  getUsers: () => api.get('/users/admin/list'),
  getReports: () => api.get('/reports/admin/list'),
  getSupportTickets: () => api.get('/users/admin/support-list'),

  deleteListing: (id: string) => api.post(`/listings/${id}/delete`),
  toggleBlockUser: (id: string) => api.post(`/users/admin/${id}/toggle-block`),
  toggleAdmin: (id: string) => api.post(`/users/admin/${id}/toggle-admin`),
  resolveReport: (id: string) => api.post(`/reports/admin/${id}/resolve`),
  escalateTicket: (id: string) => api.post(`/users/admin/support/${id}/escalate`),
  sendTestNotification: () => api.post('/users/admin/test-notification'),
  getCityStats: () => api.get('/listings/admin/stats/city'),
  getDailyStats: () => api.get('/listings/admin/stats/daily'),
  getMe: () => api.get('/users/me'),

  getCategories: () => api.get('/categories'),
  createCategory: (data: { nameAr: string; nameEn: string; slug: string; icon?: string; parentId?: string; order?: number }) =>
    api.post('/categories', data),
  updateCategory: (id: string, data: Partial<{ nameAr: string; nameEn: string; slug: string; icon?: string; parentId?: string; order?: number; isActive?: boolean }>) =>
    api.patch(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),

  broadcastNotification: (data: { title: string; body: string; target: 'all' | 'merchants' | 'consumers' }) =>
    api.post('/notifications/admin/broadcast', data),

  getPendingMerchants: () => api.get('/merchant/admin/pending'),
  verifyMerchant: (id: string) => api.patch(`/merchant/admin/verify/${id}`),

  getModerationQueue: (limit = 50, offset = 0) =>
    api.get(`/moderation/queue?limit=${limit}&offset=${offset}`),
  getModerationStats: () => api.get('/moderation/stats'),
  approveModeration: (id: string) => api.post(`/moderation/${id}/approve`),
  rejectModeration: (id: string, reason?: string) =>
    api.post(`/moderation/${id}/reject`, { reason }),
};
