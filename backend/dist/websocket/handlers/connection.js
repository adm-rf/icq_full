"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupWebSocketHandlers = setupWebSocketHandlers;
const logger_1 = __importDefault(require("../../utils/logger"));
const events_1 = require("../events");
const auth_1 = require("../middleware/auth");
const message_1 = require("./message");
const conversation_1 = require("./conversation");
/**
 * Настройка обработчиков WebSocket событий
 * @param io - экземпляр Socket.IO сервера
 */
function setupWebSocketHandlers(io) {
    io.on('connection', (socket) => {
        const user = (0, auth_1.getAuthenticatedUser)(socket);
        logger_1.default.info(`🔌 User ${user.username} connected with socket ${socket.id}`);
        // Обработка аутентификации (дополнительная после middleware)
        socket.on(events_1.ClientEvents.AUTHENTICATE, (payload) => {
            logger_1.default.debug(`Auth event received from ${user.username}`);
            socket.emit(events_1.ServerEvents.AUTH_SUCCESS, {
                userId: user.id,
                username: user.username,
            });
        });
        // Обработка отправки сообщения
        socket.on(events_1.ClientEvents.MESSAGE_SEND, async (payload) => {
            try {
                await (0, message_1.handleMessageSend)(io, socket, payload);
            }
            catch (error) {
                logger_1.default.error(`Error sending message:`, error);
                socket.emit(events_1.ServerEvents.MESSAGE_ERROR, {
                    code: 'MESSAGE_SEND_FAILED',
                    message: 'Failed to send message',
                });
            }
        });
        // Обработка прочтения сообщения
        socket.on(events_1.ClientEvents.MESSAGE_READ, (payload) => {
            // TODO: Реализовать обработку прочтения
            logger_1.default.debug(`Message read: ${JSON.stringify(payload)}`);
        });
        // Обработка индикатора набора текста
        socket.on(events_1.ClientEvents.MESSAGE_TYPING, (payload) => {
            // TODO: Реализовать обработку typing статуса
            logger_1.default.debug(`Typing status: ${JSON.stringify(payload)}`);
        });
        // Присоединение к чату
        socket.on(events_1.ClientEvents.CONVERSATION_JOIN, async (payload) => {
            try {
                await (0, conversation_1.handleConversationJoin)(io, socket, payload);
            }
            catch (error) {
                logger_1.default.error(`Error joining conversation:`, error);
            }
        });
        // Покидание чата
        socket.on(events_1.ClientEvents.CONVERSATION_LEAVE, async (payload) => {
            try {
                await (0, conversation_1.handleConversationLeave)(io, socket, payload);
            }
            catch (error) {
                logger_1.default.error(`Error leaving conversation:`, error);
            }
        });
        // Обновление статуса присутствия
        socket.on(events_1.ClientEvents.PRESENCE_UPDATE, (payload) => {
            // TODO: Реализовать обновление статуса
            logger_1.default.debug(`Presence update: ${JSON.stringify(payload)}`);
        });
        // Обработка отключения
        socket.on('disconnect', () => {
            logger_1.default.info(`🔌 User ${user.username} disconnected`);
            // TODO: Обновить статус пользователя на offline
            // TODO: Уведомить участников чатов
        });
        // Обработка ошибок
        socket.on('error', (error) => {
            logger_1.default.error(`Socket error for user ${user.username}:`, error);
        });
    });
    logger_1.default.info('✅ WebSocket handlers configured');
}
//# sourceMappingURL=connection.js.map