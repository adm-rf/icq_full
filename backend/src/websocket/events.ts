/**
 * WebSocket события - enum для типизации событий
 */

/** События от клиента к серверу (Client -> Server) */
export enum ClientEvents {
  // Аутентификация
  AUTHENTICATE = 'auth:authenticate',
  
  // Сообщения
  MESSAGE_SEND = 'message:send',
  MESSAGE_READ = 'message:read',
  MESSAGE_TYPING = 'message:typing',
  
  // Конверсации
  CONVERSATION_JOIN = 'conversation:join',
  CONVERSATION_LEAVE = 'conversation:leave',
  
  // Присутствие
  PRESENCE_UPDATE = 'presence:update',
}

/** События от сервера к клиенту (Server -> Client) */
export enum ServerEvents {
  // Аутентификация
  AUTH_SUCCESS = 'auth:success',
  AUTH_ERROR = 'auth:error',
  
  // Сообщения
  MESSAGE_NEW = 'message:new',
  MESSAGE_DELIVERED = 'message:delivered',
  MESSAGE_READ = 'message:read',
  MESSAGE_TYPING = 'message:typing',
  MESSAGE_ERROR = 'message:error',
  
  // Конверсации
  CONVERSATION_UPDATED = 'conversation:updated',
  CONVERSATION_USER_JOINED = 'conversation:user_joined',
  CONVERSATION_USER_LEFT = 'conversation:user_left',
  
  // Присутствие
  PRESENCE_UPDATE = 'presence:update',
  PRESENCE_STATUS = 'presence:status',
  
  // Ошибки
  ERROR = 'error',
}

/** Типы payload для событий */

export interface AuthPayload {
  token: string;
}

export interface SendMessagePayload {
  conversationId: number;
  content: string;
  type?: 'text' | 'image' | 'file' | 'voice';
}

export interface MessageReadPayload {
  conversationId: number;
  messageId: number;
}

export interface TypingPayload {
  conversationId: number;
  isTyping: boolean;
}

export interface ConversationJoinPayload {
  conversationId: number;
}

export interface PresenceUpdatePayload {
  status: 'online' | 'offline' | 'away' | 'busy';
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: Record<string, any>;
}
