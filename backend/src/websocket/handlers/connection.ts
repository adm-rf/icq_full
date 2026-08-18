import { Socket } from 'socket.io';
import { Op } from 'sequelize';
import logger from '../../utils/logger';
import { User, Conversation } from '../../models';

export const handleConnection = async (socket: Socket, io: any): Promise<void> => {
  const userId = (socket as any).userId;

  if (!userId) {
    logger.warn('Socket connection without authenticated user');
    socket.disconnect(true);
    return;
  }

  // Join user-specific room for direct messaging
  socket.join(`user_${userId}`);
  logger.info(`User ${userId} joined room: user_${userId}`);

  // Update user status to online in database
  try {
    await User.update(
      { status: 'online', lastSeen: new Date() },
      { where: { id: userId } }
    );
    logger.debug(`User ${userId} status updated to online`);
  } catch (error) {
    logger.error(`Failed to update user ${userId} status:`, error);
  }

  // Auto-join all conversations user is part of
  try {
    const userConversations = await Conversation.findAll({
      where: { participantIds: { [Op.contains]: [userId] } },
      attributes: ['id'],
    });

    for (const conv of userConversations) {
      socket.join(`conversation_${conv.id}`);
      logger.debug(`User ${userId} auto-joined conversation room: ${conv.id}`);
    }
  } catch (error) {
    logger.error(`Failed to auto-join conversations for user ${userId}:`, error);
  }

  socket.emit('connection:confirmed', {
    message: 'Connected to ICQ Messenger',
    userId,
    socketId: socket.id,
  });
};
