/**
 * WebSocket события - enum для типизации событий
 */
/** События от клиента к серверу (Client -> Server) */
export declare enum ClientEvents {
    AUTHENTICATE = "auth:authenticate",
    MESSAGE_SEND = "message:send",
    MESSAGE_READ = "message:read",
    MESSAGE_TYPING = "message:typing",
    CONVERSATION_JOIN = "conversation:join",
    CONVERSATION_LEAVE = "conversation:leave",
    PRESENCE_UPDATE = "presence:update"
}
/** События от сервера к клиенту (Server -> Client) */
export declare enum ServerEvents {
    AUTH_SUCCESS = "auth:success",
    AUTH_ERROR = "auth:error",
    MESSAGE_NEW = "message:new",
    MESSAGE_DELIVERED = "message:delivered",
    MESSAGE_READ = "message:read",
    MESSAGE_TYPING = "message:typing",
    MESSAGE_ERROR = "message:error",
    CONVERSATION_UPDATED = "conversation:updated",
    CONVERSATION_USER_JOINED = "conversation:user_joined",
    CONVERSATION_USER_LEFT = "conversation:user_left",
    PRESENCE_UPDATE = "presence:update",
    PRESENCE_STATUS = "presence:status",
    ERROR = "error"
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
//# sourceMappingURL=events.d.ts.map