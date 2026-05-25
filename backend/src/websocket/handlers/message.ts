import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger';
import { SendMessagePayload, ServerEvents } from '../events';
import { getAuthenticatedUser } from '../middleware/auth';

/**
 * Обработчик отправки сообщения через WebSocket
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет отправителя
 * @param payload - данные сообщения
 */
export async function handleMessageSend(
  io: Server,
  socket: Socket,
  payload: SendMessagePayload
): Promise<void> {
  const user = getAuthenticatedUser(socket);
  
  logger.debug(`Message send request from ${user.username}:`, payload);
  
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
  socket.emit(ServerEvents.MESSAGE_NEW, messageData);
  
  // TODO: Отправить сообщение другим участникам чата
  // socket.to(`conversation:${payload.conversationId}`).emit(ServerEvents.MESSAGE_NEW, messageData);
  
  logger.info(`Message sent to conversation ${payload.conversationId} by ${user.username}`);
}

/**
 * Обработчик отметки о прочтении сообщения
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет пользователя
 * @param payload - данные о прочтении
 */
export async function handleMessageRead(
  io: Server,
  socket: Socket,
  payload: { conversationId: number; messageId: number }
): Promise<void> {
  const user = getAuthenticatedUser(socket);
  
  logger.debug(`Message read by ${user.username}:`, payload);
  
  // TODO: Реализовать логику отметки о прочтении
  // 1. Обновить статус сообщения в БД
  // 2. Уведомить других участников через WebSocket
  
  socket.emit(ServerEvents.MESSAGE_READ, {
    conversationId: payload.conversationId,
    messageId: payload.messageId,
    readBy: user.id,
    readAt: new Date().toISOString(),
  });
}
