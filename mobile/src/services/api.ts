import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getAccessToken, getRefreshToken, clearAuth } from './storage';

// TODO: Заменить на переменную окружения
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Создание и настройка Axios инстанса для REST API запросов
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ошибок и refresh токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Если ошибка 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = await getRefreshToken();
        
        if (!refreshToken) {
          await clearAuth();
          return Promise.reject(error);
        }
        
        // TODO: Реализовать endpoint для refresh токена
        // const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        // const newToken = response.data.token;
        // await saveTokens(newToken, refreshToken);
        // originalRequest.headers.Authorization = `Bearer ${newToken}`;
        // return api(originalRequest);
        
        await clearAuth();
        return Promise.reject(error);
      } catch (refreshError) {
        await clearAuth();
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

/**
 * Auth API методы
 */
export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    api.post('/auth/register', data),
  
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/users/profile'),
  
  updateProfile: (data: { username?: string; avatarUrl?: string | null; status?: string }) =>
    api.put('/users/profile', data),
};

/**
 * Conversations API методы
 */
export const conversationsApi = {
  getAll: () => api.get('/conversations'),
  
  getById: (id: number) => api.get(`/conversations/${id}`),
  
  create: (data: { type: 'direct' | 'group'; name?: string; participantIds: number[] }) =>
    api.post('/conversations', data),
  
  delete: (id: number) => api.delete(`/conversations/${id}`),
  
  getMessages: (conversationId: number, params?: { limit?: number; before?: string }) =>
    api.get(`/conversations/${conversationId}/messages`, { params }),
  
  sendMessage: (conversationId: number, data: { content: string; type?: string }) =>
    api.post(`/conversations/${conversationId}/messages`, data),
  
  markAsRead: (conversationId: number, messageId: number) =>
    api.post(`/conversations/${conversationId}/messages/${messageId}/read`),
};

/**
 * Users API методы
 */
export const usersApi = {
  search: (query: string, limit?: number) =>
    api.get('/users/search', { params: { q: query, limit } }),
  
  getById: (id: number) => api.get(`/users/${id}`),
};

export default api;
