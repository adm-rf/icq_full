import { Router } from 'express';
import { Op } from 'sequelize';
import { authMiddleware } from './users';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { validationResult } from 'express-validator';
import {
  createConversationValidator,
  conversationIdValidator,
  createMessageValidator,
} from '../utils/validators';
import { User, Conversation, Message, MessageType, MessageStatus } from '../models';
import logger from '../utils/logger';
import { getIO } from '../config/socket';

const router = Router();

/**
 * @route   GET /api/conversations
 * @desc    Get all conversations for current user
 * @access  Private
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;

    const conversations = await Conversation.findAll({
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'username', 'avatarUrl', 'status'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username', 'avatarUrl'],
        },
        {
          model: Message,
          as: 'messages',
          limit: 1,
          order: [['createdAt', 'DESC']],
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'avatarUrl'],
            },
          ],
        },
      ],
      where: {
        participantIds: { [Op.contains]: [userId] },
      },
      order: [['updatedAt', 'DESC']],
    });

    res.json({
      success: true,
      data: { conversations },
    });
  })
);

/**
 * @route   POST /api/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post(
  '/',
  authMiddleware,
  createConversationValidator,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const userId = (req as any).userId;
    const { name, type, participantIds } = req.body;

    // Add creator to participants if not already included
    const allParticipantIds = Array.from(
      new Set([...participantIds, userId])
    );

    // Verify all participants exist
    const participants = await User.findAll({
      where: { id: { [Op.in]: allParticipantIds } },
      attributes: ['id', 'username', 'email', 'avatarUrl'],
    });

    if (participants.length !== allParticipantIds.length) {
      throw new AppError('One or more participants not found', 404);
    }

    // For direct messages, check if conversation already exists between these two users
    if (type === 'direct' && allParticipantIds.length === 2) {
      const existingConversation = await Conversation.findOne({
        where: { 
          type: 'direct',
          participantIds: { [Op.overlap]: allParticipantIds }
        },
      });

      // Check if both users are in the conversation
      if (existingConversation && 
          existingConversation.participantIds.includes(allParticipantIds[0]) &&
          existingConversation.participantIds.includes(allParticipantIds[1])) {
        return res.json({
          success: true,
          data: { conversation: existingConversation },
          message: 'Conversation already exists',
        });
      }
    }

    const conversation = await Conversation.create({
      name: name || null,
      type,
      createdBy: userId,
      participantIds: allParticipantIds,
    } as any);

    // Add participants through junction table
    await conversation.addParticipants(participants);

    logger.info(`Conversation created: ${conversation.id} by user ${userId}`);

    // Emit WebSocket event
    const io = getIO();
    participants.forEach((participant) => {
      io.to(`user_${participant.id}`).emit('newChat', {
        conversation,
      });
    });

    res.status(201).json({
      success: true,
      data: { conversation },
    });
  })
);

/**
 * @route   GET /api/conversations/:conversationId
 * @desc    Get conversation with messages
 * @access  Private
 */
router.get(
  '/:conversationId',
  authMiddleware,
  conversationIdValidator,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { conversationId } = req.params;

    const conversation = await Conversation.findByPk(conversationId, {
      include: [
        {
          model: User,
          as: 'participants',
          attributes: ['id', 'username', 'avatarUrl', 'status'],
        },
        {
          model: Message,
          as: 'messages',
          include: [
            {
              model: User,
              as: 'sender',
              attributes: ['id', 'username', 'avatarUrl'],
            },
          ],
          order: [['createdAt', 'ASC']],
        },
      ],
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Check if user is a participant using participantIds array
    const isParticipant = conversation.participantIds.includes(userId);
    if (!isParticipant) {
      throw new AppError('Access denied', 403);
    }

    res.json({
      success: true,
      data: { conversation },
    });
  })
);

/**
 * @route   POST /api/conversations/:conversationId/messages
 * @desc    Send a message to conversation
 * @access  Private
 */
router.post(
  '/:conversationId/messages',
  authMiddleware,
  conversationIdValidator,
  createMessageValidator,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const userId = (req as any).userId;
    const { conversationId } = req.params;
    const { content, type = 'text' } = req.body;

    const conversation = await Conversation.findByPk(conversationId, {
      include: [{ model: User, as: 'participants' }],
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Check if user is a participant using participantIds array
    const isParticipant = conversation.participantIds.includes(userId);
    if (!isParticipant) {
      throw new AppError('Access denied', 403);
    }

    // Get sender username for senderName field
    const sender = await User.findByPk(userId, {
      attributes: ['username'],
    });

    const message = await Message.create({
      content,
      type: type as MessageType,
      senderId: userId,
      senderName: sender?.username || 'Unknown',
      conversationId,
      status: MessageStatus.SENT,
      readAt: null,
    } as any);

    // Populate sender info
    await message.reload({
      include: [
        {
          model: User,
          as: 'sender',
          attributes: ['id', 'username', 'avatarUrl'],
        },
      ],
    });

    logger.info(`Message sent: ${message.id} in conversation ${conversationId}`);

    // Emit WebSocket event to all participants
    const io = getIO();
    
    conversation.participants!.forEach((participant) => {
      if (participant.id !== userId) {
        io.to(`user_${participant.id}`).emit('newMessage', {
          message,
          conversationId,
        });
        // Also emit to conversation room for users who joined it
        io.to(`conversation_${conversationId}`).emit('newMessage', {
          message,
          conversationId,
        });
      }
    });

    // Also emit to the sender for confirmation
    io.to(`user_${userId}`).emit('newMessage', {
      message,
      conversationId,
    });

    res.status(201).json({
      success: true,
      data: { message },
    });
  })
);

/**
 * @route   DELETE /api/conversations/:conversationId
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete(
  '/:conversationId',
  authMiddleware,
  conversationIdValidator,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { conversationId } = req.params;

    const conversation = await Conversation.findByPk(conversationId, {
      include: [{ model: User, as: 'participants' }],
    });

    if (!conversation) {
      throw new AppError('Conversation not found', 404);
    }

    // Only creator can delete
    if (conversation.createdBy !== userId) {
      throw new AppError('Only creator can delete conversation', 403);
    }

    // Remove from participants junction table first
    await conversation.removeParticipants(conversation.participants!);

    // Delete conversation (messages will be deleted automatically via CASCADE)
    await conversation.destroy();

    logger.info(`Conversation deleted: ${conversationId}`);

    // Emit WebSocket event
    const io = getIO();
    conversation.participants!.forEach((participant) => {
      io.to(`user_${participant.id}`).emit('chatDeleted', {
        conversationId,
      });
    });

    res.json({
      success: true,
      message: 'Conversation deleted successfully',
    });
  })
);

export default router;
