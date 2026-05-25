import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger';
import { ClientEvents, ServerEvents } from '../events';
import { getAuthenticatedUser } from '../middleware/auth';
import { handleMessageSend } from './message';
import { handleConversationJoin, handleConversationLeave } from './conversation';

/**
 * Настройка обработчиков WebSocket событий
 * @param io - экземпляр Socket.IO сервера
 */
export function setupWebSocketHandlers(io: Server): void {
  io.on('connection', (socket: Socket) => {
    const user = getAuthenticatedUser(socket);
    logger.info(`🔌 User ${user.username} connected with socket ${socket.id}`);

    // Обработка аутентификации (дополнительная после middleware)
    socket.on(ClientEvents.AUTHENTICATE, (payload) => {
      logger.debug(`Auth event received from ${user.username}`);
      socket.emit(ServerEvents.AUTH_SUCCESS, {
        userId: user.id,
        username: user.username,
      });
    });

    // Обработка отправки сообщения
    socket.on(ClientEvents.MESSAGE_SEND, async (payload) => {
      try {
        await handleMessageSend(io, socket, payload);
      } catch (error) {
        logger.error(`Error sending message:`, error);
        socket.emit(ServerEvents.MESSAGE_ERROR, {
          code: 'MESSAGE_SEND_FAILED',
          message: 'Failed to send message',
        });
      }
    });

    // Обработка прочтения сообщения
    socket.on(ClientEvents.MESSAGE_READ, (payload) => {
      // TODO: Реализовать обработку прочтения
      logger.debug(`Message read: ${JSON.stringify(payload)}`);
    });

    // Обработка индикатора набора текста
    socket.on(ClientEvents.MESSAGE_TYPING, (payload) => {
      // TODO: Реализовать обработку typing статуса
      logger.debug(`Typing status: ${JSON.stringify(payload)}`);
    });

    // Присоединение к чату
    socket.on(ClientEvents.CONVERSATION_JOIN, async (payload) => {
      try {
        await handleConversationJoin(io, socket, payload);
      } catch (error) {
        logger.error(`Error joining conversation:`, error);
      }
    });

    // Покидание чата
    socket.on(ClientEvents.CONVERSATION_LEAVE, async (payload) => {
      try {
        await handleConversationLeave(io, socket, payload);
      } catch (error) {
        logger.error(`Error leaving conversation:`, error);
      }
    });

    // Обновление статуса присутствия
    socket.on(ClientEvents.PRESENCE_UPDATE, (payload) => {
      // TODO: Реализовать обновление статуса
      logger.debug(`Presence update: ${JSON.stringify(payload)}`);
    });

    // Обработка отключения
    socket.on('disconnect', () => {
      logger.info(`🔌 User ${user.username} disconnected`);
      // TODO: Обновить статус пользователя на offline
      // TODO: Уведомить участников чатов
    });

    // Обработка ошибок
    socket.on('error', (error) => {
      logger.error(`Socket error for user ${user.username}:`, error);
    });
  });

  logger.info('✅ WebSocket handlers configured');
}
