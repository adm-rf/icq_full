import { api } from '../config/api';
import * as SecureStore from 'expo-secure-store';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  avatarUrl?: string | null;
  status?: string;
}

// Реальная структура ответа от backend
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface AuthData {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authService = {
  async login(data: LoginData): Promise<User> {
    const response = await api.post<ApiResponse<AuthData>>('/auth/login', data);
    const { tokens, user } = response.data.data;
    
    // Сохраняем оба токена
    await SecureStore.setItemAsync('authToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    
    return user;
  },

  async register(data: RegisterData): Promise<User> {
    const response = await api.post<ApiResponse<AuthData>>('/auth/register', data);
    const { tokens, user } = response.data.data;
    
    await SecureStore.setItemAsync('authToken', tokens.accessToken);
    await SecureStore.setItemAsync('refreshToken', tokens.refreshToken);
    
    return user;
  },

  async logout(): Promise<void> {
    await SecureStore.deleteItemAsync('authToken');
    await SecureStore.deleteItemAsync('refreshToken');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};
