// src/services/api.js

import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Something went wrong';

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error(message);
    } else if (error.response?.status === 422) {
      // Validation errors
      const errors = error.response?.data?.errors;
      if (errors) {
        Object.values(errors).flat().forEach(err => toast.error(err));
      } else {
        toast.error(message);
      }
    } else {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// ─── AUTH APIs ──────────────────────────────────

export const authAPI = {
  register: (data) => api.post('/register', data),
  login: (data) => api.post('/login', data),
  logout: () => api.post('/logout'),
  me: () => api.get('/me'),
  refresh: () => api.post('/refresh'),
};

// ─── SERVICE APIs ───────────────────────────────

export const serviceAPI = {
  getAll: (params) => api.get('/services', { params }),
  getById: (id) => api.get(`/services/${id}`),
  getReviews: (id) => api.get(`/services/${id}/reviews`),
};
// ─── STAFF APIs ─────────────────────────────────
export const staffAPI = {
    getAll: () => api.get('/staff'),
};
// ─── BOOKING APIs ───────────────────────────────

export const bookingAPI = {
  getAvailableDates: (params) => api.get('/booking/available-dates', { params }),
  getAvailableSlots: (params) => api.get('/booking/available-slots', { params }),
  calculatePrice: (data) => api.post('/booking/calculate-price', data),
  create: (data) => api.post('/booking', data),
  myBookings: (params) => api.get('/my-bookings', { params }),
  getBooking: (id) => api.get(`/my-bookings/${id}`),
  cancel: (id, reason) => api.post(`/my-bookings/${id}/cancel`, { reason }),
};
// ─── QUEUE APIs ─────────────────────────────────

export const queueAPI = {
  todayQueue: () => api.get('/queue/today'),
  myStatus: (bookingId) => api.get(`/queue/my-status/${bookingId}`),
};

// ─── PAYMENT APIs ─────────────────────────────────

export const paymentAPI = {
  createOrder: (bookingId) => api.post(`/payment/create-order/${bookingId}`),
  verify: (data) => api.post('/payment/verify', data),
  chooseCash: (bookingId) => api.post(`/payment/cash/${bookingId}`),
};
// ─── REVIEW APIs ────────────────────────────────

export const reviewAPI = {
  submit: (data) => api.post('/reviews', data),
};

// ─── NOTIFICATION APIs ──────────────────────────

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// ─── SETTINGS APIs ──────────────────────────────

export const settingsAPI = {
  getPublic: () => api.get('/settings/public'),
};

// src/services/api.js (COMPLETE — add these remaining admin APIs)

// ─── ADMIN APIs (continued) ─────────────────────

export const adminAPI = {
  // Dashboard
  dashboard: () => api.get('/admin/dashboard'),

  // Services
  getServices: () => api.get('/admin/services'),
  createService: (data) => api.post('/admin/services', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateService: (id, data) => api.post(`/admin/services/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
}),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  toggleService: (id) => api.patch(`/admin/services/${id}/toggle`),

  // Bookings
  getBookings: (params) => api.get('/admin/bookings', { params }),
  todayBookings: () => api.get('/admin/bookings/today'),
  getBooking: (id) => api.get(`/admin/bookings/${id}`),
  updateBookingStatus: (id, status) => api.put(`/admin/bookings/${id}/status`, { status }),
  lateArrival: (id) => api.post(`/admin/bookings/${id}/late-arrival`),
  cashPayment: (id) => api.post(`/admin/bookings/${id}/cash-payment`),

  // Slots
  getWorkingHours: () => api.get('/admin/working-hours'),
  updateWorkingHours: (hours) => api.put('/admin/working-hours', { hours }),
  generateSlots: (from, to) => api.post('/admin/slots/generate', { from, to }),
  viewSlots: (date) => api.get('/admin/slots', { params: { date } }),
  blockDate: (data) => api.post('/admin/slots/block-date', data),
  unblockDate: (data) => api.post('/admin/slots/unblock-date', data),
  getBlockedDates: () => api.get('/admin/blocked-dates'),

  // Queue
  getQueue: () => api.get('/admin/queue'),
  callNext: () => api.post('/admin/queue/call-next'),
  checkIn: (bookingId) => api.post(`/admin/queue/check-in/${bookingId}`),
  completeService: (bookingId) => api.post(`/admin/queue/complete/${bookingId}`),
  markNoShow: (bookingId) => api.post(`/admin/queue/no-show/${bookingId}`),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (data) => api.put('/admin/settings', data),
  bulkUpdateSettings: (settings) => api.put('/admin/settings/bulk', { settings }),

  // Staff
  getStaff: () => api.get('/admin/staff'),
  createStaff: (data) => api.post('/admin/staff', data, {
    headers: { 'Content-Type': undefined },
  }),
  updateStaff: (id, data) => api.put(`/admin/staff/${id}`, data, {
    headers: { 'Content-Type': undefined },
  }),
  deleteStaff: (id) => api.delete(`/admin/staff/${id}`),

  // Coupons
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.put(`/admin/coupons/${id}`, data),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),
  toggleCoupon: (id) => api.patch(`/admin/coupons/${id}/toggle`),
};
// ─── STAFF PORTAL APIs ────────────────────────────

export const staffPortalAPI = {
  dashboard: () => api.get('/staff/dashboard'),
  mySchedule: (date) => api.get('/staff/my-schedule', { params: { date } }),
  todayBookings: () => api.get('/staff/today-bookings'),
  collectCash: (bookingId) => api.post(`/staff/collect-cash/${bookingId}`),
  startService: (bookingId) => api.post(`/staff/start-service/${bookingId}`),
  completeService: (bookingId) => api.post(`/staff/complete-service/${bookingId}`),
};
export default api;