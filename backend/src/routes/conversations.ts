import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import jwt from 'jsonwebtoken';
import Conversation from '../models/Conversation';
import Message from '../models/Message';

const router = Router();

let io: any = null;

export const setSocketIO = (socketIO: any) => {
  io = socketIO;
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    (req as any).userId = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    (req as any).userId = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.userId;
  } catch (error) {
    (req as any).userId = null;
  }
  next();
};

router.use(authMiddleware);

// GET /api/conversations - список чатов из БД
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;

  const all = await Conversation.findAll({ order: [['updatedAt', 'DESC']] });
  const mine = userId ? all.filter(c => (c.participantIds || []).includes(userId)) : all;

  const data = await Promise.all(
    mine.map(async (chat) => {
      const last = await Message.findOne({
        where: { conversationId: chat.id },
        order: [['createdAt', 'DESC']],
      });
      return {
        ...(chat.toJSON() as any),
        lastMessage: last ? (last.toJSON() as any) : null,
        unreadCount: 0,
      };
    })
  );

  res.json({ success: true, data });
  return;
}));

// POST /api/conversations - создать чат в БД
router.post('/', asyncHandler(async (req, res) => {
  const { type = 'group', name, participantIds = [] } = req.body || {};
  const creatorId = (req as any).userId;

  let chatName = name;
  if (type === 'direct' && !chatName && participantIds.length > 0) {
    chatName = `Chat with User ${participantIds[0]}`;
  }

  const allParticipants = creatorId
    ? Array.from(new Set([creatorId, ...participantIds]))
    : participantIds;

  const chat = await Conversation.create({
    type,
    name: chatName || 'Новый чат',
    participantIds: allParticipants,
    createdBy: creatorId,
  } as any);

  console.log('✅ Чат создан в БД, id:', chat.id);

  if (io) {
    allParticipants.forEach((uid: number) => {
      io.to(`user_${uid}`).emit('newChat', chat.toJSON());
    });
  }

  res.status(201).json({ success: true, data: chat.toJSON() });
  return;
}));

// DELETE /api/conversations/:id - удалить чат из БД
router.delete('/:id', asyncHandler(async (req, res) => {
  const chatId = Number(req.params.id);
  const chat = await Conversation.findByPk(chatId);

  if (chat) {
    const participants = chat.participantIds || [];
    await Message.destroy({ where: { conversationId: chatId } });
    await chat.destroy();

    if (io) {
      participants.forEach((uid: number) => {
        io.to(`user_${uid}`).emit('chatDeleted', { chatId });
      });
    }
  }

  res.json({ success: true, message: 'Chat deleted' });
  return;
}));

// GET /api/conversations/:id/messages - сообщения из БД
router.get('/:id/messages', asyncHandler(async (req, res) => {
  const chatId = Number(req.params.id);
  const msgs = await Message.findAll({
    where: { conversationId: chatId },
    order: [['createdAt', 'ASC']],
  });

  res.json({ success: true, data: msgs.map(m => m.toJSON()) });
  return;
}));

// POST /api/conversations/:id/messages - сохранить сообщение в БД
router.post('/:id/messages', asyncHandler(async (req, res) => {
  const chatId = Number(req.params.id);
  const { content, type = 'text', senderId, senderName } = req.body || {};
  const userId = (req as any).userId;

  const chat = await Conversation.findByPk(chatId);
  if (!chat) {
    res.status(404).json({ success: false, message: 'Chat not found' });
    return;
  }

  const message = await Message.create({
    conversationId: chatId,
    content: content || '',
    type: type || 'text',
    senderId: senderId || userId || 1,
    senderName: senderName || 'User',
    status: 'sent',
  } as any);

  console.log('📤 Сообщение сохранено в БД, id:', message.id);

  if (io) {
    (chat.participantIds || []).forEach((uid: number) => {
      io.to(`user_${uid}`).emit('newMessage', {
        chatId,
        message: message.toJSON(),
        chatName: chat.name,
      });
    });
  }

  res.status(201).json({ success: true, data: message.toJSON() });
  return;
}));

// PATCH /:id/messages/:messageId/delivered - сообщение доставлено
router.patch('/:id/messages/:messageId/delivered', asyncHandler(async (req, res) => {
  const messageId = Number(req.params.messageId);
  const message = await Message.findByPk(messageId);

  if (!message) {
    res.status(404).json({ success: false, message: 'Message not found' });
    return;
  }

  if (message.status === 'sent') {
    message.status = 'delivered';
    await message.save();
  }

  const chat = await Conversation.findByPk(Number(req.params.id));
  if (io && chat) {
    (chat.participantIds || []).forEach((uid: number) => {
      io.to(`user_${uid}`).emit('messageDelivered', { messageId: message.id, chatId: message.conversationId });
    });
  }

  res.json({ success: true, data: message.toJSON() });
  return;
}));

// PATCH /:id/messages/:messageId/read - сообщение прочитано
router.patch('/:id/messages/:messageId/read', asyncHandler(async (req, res) => {
  const messageId = Number(req.params.messageId);
  const message = await Message.findByPk(messageId);

  if (!message) {
    res.status(404).json({ success: false, message: 'Message not found' });
    return;
  }

  if (message.status !== 'read') {
    message.status = 'read';
    message.readAt = new Date();
    await message.save();
  }

  const chat = await Conversation.findByPk(Number(req.params.id));
  if (io && chat) {
    (chat.participantIds || []).forEach((uid: number) => {
      io.to(`user_${uid}`).emit('messageRead', { messageId: message.id, chatId: message.conversationId });
    });
  }

  res.json({ success: true, data: message.toJSON() });
  return;
}));

export default router;
