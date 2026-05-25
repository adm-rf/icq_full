import { Server, Socket } from 'socket.io';
import logger from '../../utils/logger';
import { ConversationJoinPayload, ServerEvents } from '../events';
import { getAuthenticatedUser } from '../middleware/auth';

/**
 * Обработчик присоединения пользователя к чату
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет пользователя
 * @param payload - данные о чате
 */
export async function handleConversationJoin(
  io: Server,
  socket: Socket,
  payload: ConversationJoinPayload
): Promise<void> {
  const user = getAuthenticatedUser(socket);
  const roomName = `conversation:${payload.conversationId}`;
  
  // Присоединяем к комнате чата
  await socket.join(roomName);
  
  logger.info(`User ${user.username} joined conversation ${payload.conversationId}`);
  
  // Уведомляем других участников
  socket.to(roomName).emit(ServerEvents.CONVERSATION_USER_JOINED, {
    conversationId: payload.conversationId,
    userId: user.id,
    username: user.username,
    joinedAt: new Date().toISOString(),
  });
  
  // Отправляем подтверждение пользователю
  socket.emit(ServerEvents.CONVERSATION_UPDATED, {
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
export async function handleConversationLeave(
  io: Server,
  socket: Socket,
  payload: ConversationJoinPayload
): Promise<void> {
  const user = getAuthenticatedUser(socket);
  const roomName = `conversation:${payload.conversationId}`;
  
  // Покидаем комнату чата
  await socket.leave(roomName);
  
  logger.info(`User ${user.username} left conversation ${payload.conversationId}`);
  
  // Уведомляем других участников
  socket.to(roomName).emit(ServerEvents.CONVERSATION_USER_LEFT, {
    conversationId: payload.conversationId,
    userId: user.id,
    username: user.username,
    leftAt: new Date().toISOString(),
  });
  
  // Отправляем подтверждение пользователю
  socket.emit(ServerEvents.CONVERSATION_UPDATED, {
    conversationId: payload.conversationId,
    action: 'left',
  });
}
