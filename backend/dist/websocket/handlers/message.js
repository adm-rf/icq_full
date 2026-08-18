"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleMessageSend = handleMessageSend;
exports.handleMessageRead = handleMessageRead;
const logger_1 = __importDefault(require("../../utils/logger"));
const events_1 = require("../events");
const auth_1 = require("../middleware/auth");
/**
 * Обработчик отправки сообщения через WebSocket
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет отправителя
 * @param payload - данные сообщения
 */
async function handleMessageSend(io, socket, payload) {
    const user = (0, auth_1.getAuthenticatedUser)(socket);
    logger_1.default.debug(`Message send request from ${user.username}:`, payload);
    // TODO: Реализовать логику отправки сообщения
    // 1. Валидировать payload
    // 2. Проверить права доступа к conversationId
    // 3. Сохранить сообщение в БД
    // 4. Отправить сообщение всем участникам чата через WebSocket
    const messageData = {
        id: Date.now(), // TODO: Заменить на реальный ID из БД
        conversationId: payload.conversationId,
        senderId: user.id,
        senderName: user.username,
        content: payload.content,
        type: payload.type || 'text',
        status: 'sent',
        createdAt: new Date().toISOString(),
    };
    // Отправляем подтверждение отправителю
    socket.emit(events_1.ServerEvents.MESSAGE_NEW, messageData);
    // TODO: Отправить сообщение другим участникам чата
    // socket.to(`conversation:${payload.conversationId}`).emit(ServerEvents.MESSAGE_NEW, messageData);
    logger_1.default.info(`Message sent to conversation ${payload.conversationId} by ${user.username}`);
}
/**
 * Обработчик отметки о прочтении сообщения
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет пользователя
 * @param payload - данные о прочтении
 */
async function handleMessageRead(io, socket, payload) {
    const user = (0, auth_1.getAuthenticatedUser)(socket);
    logger_1.default.debug(`Message read by ${user.username}:`, payload);
    // TODO: Реализовать логику отметки о прочтении
    // 1. Обновить статус сообщения в БД
    // 2. Уведомить других участников через WebSocket
    socket.emit(events_1.ServerEvents.MESSAGE_READ, {
        conversationId: payload.conversationId,
        messageId: payload.messageId,
        readBy: user.id,
        readAt: new Date().toISOString(),
    });
}
//# sourceMappingURL=message.js.map