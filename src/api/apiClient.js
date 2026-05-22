/**
 * api/apiClient.js — Axios instance kết nối tới Backend
 *
 * ⚠️  QUAN TRỌNG: Trong môi trường production, app sẽ dùng `expo.extra.apiUrl` để kết nối backend.
 *     Trong dev, app vẫn ưu tiên dùng host Expo / Metro / IP LAN.
 */

import axios from 'axios';
import { NativeModules, Platform } from 'react-native';
import Constants from 'expo-constants';

// Đổi IP này thành IP LAN mặc định máy tính của bạn nếu không tự động phát hiện được
const DEFAULT_IP = '192.168.10.44';

const getDevServerIp = () => {
  const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true;
  if (isDev) {
    // Nếu chạy trên Web (browser)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.location.hostname;
    }
    // Lấy từ Constants.expoConfig.hostUri (dành cho Expo Go / Metro)
    if (Constants.expoConfig?.hostUri) {
      const host = Constants.expoConfig.hostUri.split(':')[0];
      if (host) return host;
    }
    // Nếu chạy trên Mobile (iOS/Android) qua Expo Go / Metro (fallback)
    const scriptURL = NativeModules.SourceCode?.scriptURL;
    if (scriptURL) {
      const match = scriptURL.match(/^https?:\/\/([^:/]+)(:\d+)?/);
      if (match) {
        let ip = match[1];
        // Nếu là localhost trên giả lập Android, đổi thành 10.0.2.2 để kết nối máy chủ host
        if (ip === 'localhost' && Platform.OS === 'android') {
          ip = '10.0.2.2';
        }
        return ip;
      }
    }
  }
  return null;
};

const devIp = getDevServerIp();
const productionApiUrl = Constants.expoConfig?.extra?.apiUrl || Constants.manifest?.extra?.apiUrl;

// Ép cứng địa chỉ API chạy bằng Render kể cả trên máy ảo/điện thoại (Expo Go)
const BASE_URL = 'https://air-manager-api.onrender.com/api';

console.log(`🔌 Kết nối API tới địa chỉ: ${BASE_URL}`);

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 giây timeout (để server Render có thời gian wake up)
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request Interceptor (log mọi request) ────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📡 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (xử lý lỗi tập trung) ──────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || 'Không thể kết nối tới server';
    console.error(`❌ API Error: ${message}`);
    return Promise.reject(new Error(message));
  }
);

// ─── API Functions ─────────────────────────────────────────────────────────────

// Components
export const componentApi = {
  getAll: (params) => apiClient.get('/components', { params }),
  getStats: () => apiClient.get('/components/stats'),
  getById: (id) => apiClient.get(`/components/${id}`),
  create: (data) => apiClient.post('/components', data),
  update: (id, data) => apiClient.put(`/components/${id}`, data),
  delete: (id) => apiClient.delete(`/components/${id}`),
};

// Borrows
export const borrowApi = {
  getAll: (params) => apiClient.get('/borrows', { params }),
  create: (data) => apiClient.post('/borrows', data),
  returnItem: (id) => apiClient.put(`/borrows/${id}/return`),
};

// Users
export const userApi = {
  getAll: () => apiClient.get('/users'),
  getById: (id) => apiClient.get(`/users/${id}`),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  login: (data) => apiClient.post('/users/login', data),
};

// Kits
export const kitApi = {
  getAll: () => apiClient.get('/kits'),
  getById: (id) => apiClient.get(`/kits/${id}`),
  // ─── Tra cứu kit bằng QR Token cố định (dùng sau khi quét QR) ────────────
  getByQrToken: (token) => apiClient.get(`/kits/qr/${token}`),
  create: (data) => apiClient.post('/kits', data),
  update: (id, data) => apiClient.put(`/kits/${id}`, data),
  delete: (id, operator) => apiClient.delete(`/kits/${id}`, { params: { operator } }),
};

// Audit Logs
export const logApi = {
  getAll: () => apiClient.get('/logs'),
};

export default apiClient;
