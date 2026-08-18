/**
 * WebSocket Events Enum
 * Defines all WebSocket event names for type safety
 */

export enum WSEvent {
  // Connection events
  CONNECTION_CONFIRMED = 'connection:confirmed',

  // Message events
  MESSAGE_NEW = 'message:new',
  MESSAGE_SENT = 'message:sent',
  MESSAGE_TYPING = 'message:typing',
  MESSAGE_READ = 'message:read',
  MESSAGE_DELIVER = 'message:deliver',
  MESSAGE_READ_RECEIPT = 'message:read_receipt',

  // Conversation events
  CONVERSATION_CREATED = 'conversation:created',
  CONVERSATION_DELETED = 'conversation:deleted',
  CONVERSATION_JOIN = 'conversation:join',
  CONVERSATION_LEAVE = 'conversation:leave',

  // User events
  USER_STATUS_UPDATE = 'user:status_update',
  USER_STATUS_CHANGED = 'user:status_changed',

  // Error events
  ERROR = 'error',
}

export interface WSMessagePayload<T = unknown> {
  event: WSEvent;
  data: T;
  timestamp: Date;
}
