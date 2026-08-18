import { Socket } from 'socket.io';
import logger from '../../utils/logger';
import { Conversation, User } from '../../models';

export const handleConversation = (socket: Socket, io: any): void => {
  const userId = (socket as any).userId;

  // Join conversation room
  socket.on('conversation:join', (data: { conversationId: number }) => {
    if (!userId) return;

    socket.join(`conversation_${data.conversationId}`);
    logger.info(`User ${userId} joined conversation room: ${data.conversationId}`);
  });

  // Leave conversation room
  socket.on('conversation:leave', (data: { conversationId: number }) => {
    if (!userId) return;

    socket.leave(`conversation_${data.conversationId}`);
    logger.info(`User ${userId} left conversation room: ${data.conversationId}`);
  });

  // Handle user status change (online/offline)
  socket.on('user:status_update', async (data: { status: string }) => {
    if (!userId) return;

    logger.info(`User ${userId} status updated to: ${data.status}`);

    // Update user status in database
    try {
      await User.update(
        { status: data.status, lastSeen: new Date() },
        { where: { id: userId } }
      );
    } catch (error) {
      logger.error(`Failed to update user ${userId} status:`, error);
    }

    // Broadcast status update to all connected users
    io.emit('user:status_changed', {
      userId,
      status: data.status,
      lastSeen: data.status === 'offline' ? new Date() : null,
    });
  });
};
