import { Socket } from 'socket.io';
import logger from '../../utils/logger';
import { Message, User, Conversation, MessageStatus } from '../../models';

export const handleMessage = (socket: Socket, io: any): void => {
  const userId = (socket as any).userId;

  // Handle typing indicator
  socket.on('message:typing', async (data: { conversationId: number; isTyping: boolean }) => {
    if (!userId) return;

    logger.debug(`User ${userId} typing in conversation ${data.conversationId}`);

    // Broadcast typing status to other participants in the conversation room
    socket.to(`conversation_${data.conversationId}`).emit('message:typing', {
      userId,
      conversationId: data.conversationId,
      isTyping: data.isTyping,
    });
  });

  // Handle message read receipt
  socket.on('message:read', async (data: { messageId: number; conversationId: number }) => {
    if (!userId) return;

    logger.debug(`Message ${data.messageId} read by user ${userId}`);

    try {
      // Update message status in database
      await Message.update(
        { status: MessageStatus.READ, readAt: new Date() },
        { where: { id: data.messageId } }
      );
    } catch (error) {
      logger.error(`Failed to update message ${data.messageId} status:`, error);
    }

    // Emit read receipt to sender
    io.to(`user_${userId}`).emit('message:read_receipt', {
      messageId: data.messageId,
      conversationId: data.conversationId,
      readBy: userId,
      readAt: new Date(),
    });
  });

  // Handle message delivery confirmation
  socket.on('message:deliver', async (data: { messageId: number }) => {
    if (!userId) return;

    try {
      // Update message status to delivered
      await Message.update(
        { status: MessageStatus.DELIVERED },
        { where: { id: data.messageId } }
      );
      logger.debug(`Message ${data.messageId} delivered to user ${userId}`);
    } catch (error) {
      logger.error(`Failed to update message ${data.messageId} delivery status:`, error);
    }
  });
};
