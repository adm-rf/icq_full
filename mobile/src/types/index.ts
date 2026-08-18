/**
 * Глобальные TypeScript интерфейсы для мобильного приложения
 */

export interface User {
  id: number;
  email: string;
  username: string;
  avatarUrl?: string | null;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeenAt?: string | null;
}

export interface Conversation {
  id: number;
  name?: string | null;
  type: 'direct' | 'group';
  avatarUrl?: string | null;
  lastMessage?: Message;
  unreadCount: number;
  participants: User[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  sender?: User;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  status: 'sent' | 'delivered' | 'read';
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface MessagesState {
  messages: Record<number, Message[]>; // conversationId -> messages
  loading: Record<number, boolean>;
  error: Record<number, string | null>;
}

export interface ConversationsState {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  selectedConversationId: number | null;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface WebSocketMessage {
  event: string;
  payload: any;
}
