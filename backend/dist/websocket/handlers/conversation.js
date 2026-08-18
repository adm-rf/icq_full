"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConversationJoin = handleConversationJoin;
exports.handleConversationLeave = handleConversationLeave;
const logger_1 = __importDefault(require("../../utils/logger"));
const events_1 = require("../events");
const auth_1 = require("../middleware/auth");
/**
 * Обработчик присоединения пользователя к чату
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет пользователя
 * @param payload - данные о чате
 */
async function handleConversationJoin(io, socket, payload) {
    const user = (0, auth_1.getAuthenticatedUser)(socket);
    const roomName = `conversation:${payload.conversationId}`;
    // Присоединяем к комнате чата
    await socket.join(roomName);
    logger_1.default.info(`User ${user.username} joined conversation ${payload.conversationId}`);
    // Уведомляем других участников
    socket.to(roomName).emit(events_1.ServerEvents.CONVERSATION_USER_JOINED, {
        conversationId: payload.conversationId,
        userId: user.id,
        username: user.username,
        joinedAt: new Date().toISOString(),
    });
    // Отправляем подтверждение пользователю
    socket.emit(events_1.ServerEvents.CONVERSATION_UPDATED, {
        conversationId: payload.conversationId,
        action: 'joined',
    });
}
/**
 * Обработчик покидания чата пользователем
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет пользователя
 * @param payload - данные о чате
 */
async function handleConversationLeave(io, socket, payload) {
    const user = (0, auth_1.getAuthenticatedUser)(socket);
    const roomName = `conversation:${payload.conversationId}`;
    // Покидаем комнату чата
    await socket.leave(roomName);
    logger_1.default.info(`User ${user.username} left conversation ${payload.conversationId}`);
    // Уведомляем других участников
    socket.to(roomName).emit(events_1.ServerEvents.CONVERSATION_USER_LEFT, {
        conversationId: payload.conversationId,
        userId: user.id,
        username: user.username,
        leftAt: new Date().toISOString(),
    });
    // Отправляем подтверждение пользователю
    socket.emit(events_1.ServerEvents.CONVERSATION_UPDATED, {
        conversationId: payload.conversationId,
        action: 'left',
    });
}
//# sourceMappingURL=conversation.js.map