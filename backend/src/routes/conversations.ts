import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import jwt from 'jsonwebtoken';

const router = Router();

// In-memory хранилища
const conversationsStore: any[] = [];
const messagesStore: any[] = [];

// Ссылка на Socket.IO сервер
let io: any = null;

export const setSocketIO = (socketIO: any) => {
  io = socketIO;
};

// JWT_SECRET — тот же, что используется в auth.ts
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware для извлечения userId из JWT токена
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

// Применяем middleware ко всем роутам
router.use(authMiddleware);

// GET /api/conversations - список чатов
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  
  const chatsWithLastMessage = conversationsStore
    .filter(chat => !userId || chat.participantIds?.includes(userId))
    .map(chat => {
      const chatMessages = messagesStore
        .filter(m => m.chatId === chat.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return {
        ...chat,
        lastMessage: chatMessages[0] || null,
        unreadCount: 0
      };
    });

  res.json({ success: true, data: chatsWithLastMessage });
  return;
}));

// POST /api/conversations - создать чат
router.post('/', asyncHandler(async (req, res) => {
  const { type = 'group', name, participantIds = [] } = req.body || {};
  const creatorId = (req as any).userId;
  
  let chatName = name;
  if (type === 'direct' && !chatName && participantIds.length > 0) {
    chatName = `Chat with User ${participantIds[0]}`;
  }
  
  // ВАЖНО: Добавляем создателя в участники, если его там нет
  const allParticipants = creatorId 
    ? [...new Set([creatorId, ...participantIds])]
    : participantIds;
  
  const newChat = {
    id: Date.now(),
    type,
    name: chatName || 'Новый чат',
    participantIds: allParticipants,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  conversationsStore.push(newChat);
  
  console.log('✅ Чат создан:', newChat);
  console.log('👥 Участники:', allParticipants);
  
  // Уведомляем ВСЕХ участников через WebSocket
  if (io) {
    allParticipants.forEach((userId: number) => {
      console.log(`📤 Отправляем newChat пользователю ${userId}`);
      io.to(`user_${userId}`).emit('newChat', newChat);
    });
  }
  
  res.status(201).json({ success: true, data: newChat });
  return;
}));

// DELETE /api/conversations/:id - удалить чат
router.delete('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const chatId = Number(id);
  
  const chatIndex = conversationsStore.findIndex(c => c.id === chatId);
  if (chatIndex !== -1) {
    const chat = conversationsStore[chatIndex];
    conversationsStore.splice(chatIndex, 1);
    
    const msgIndices = messagesStore
      .map((m, i) => m.chatId === chatId ? i : -1)
      .filter(i => i !== -1)
      .sort((a, b) => b - a);
    msgIndices.forEach(i => messagesStore.splice(i, 1));
    
    if (io && chat.participantIds) {
      chat.participantIds.forEach((userId: number) => {
        io.to(`user_${userId}`).emit('chatDeleted', { chatId });
      });
    }
  }
  
  res.json({ success: true, message: 'Chat deleted' });
  return;
}));

// GET /api/conversations/:id/messages - получить сообщения чата
router.get('/:id/messages', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const chatId = Number(id);
  
  const chatMessages = messagesStore
    .filter(m => m.chatId === chatId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  res.json({ success: true, data: chatMessages });
  return;
}));

// POST /api/conversations/:id/messages - отправить сообщение
router.post('/:id/messages', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content, type = 'text', senderId, senderName } = req.body || {};
  const chatId = Number(id);
  const userId = (req as any).userId;
  
  const chat = conversationsStore.find(c => c.id === chatId);
  if (!chat) {
    res.status(404).json({ success: false, message: 'Chat not found' });
    return;
  }
  
  const message = {
    id: Date.now(),
    chatId,
    content: content || '',
    type: type || 'text',
    senderId: senderId || userId || 1,
    senderName: senderName || 'User',
    createdAt: new Date().toISOString()
  };
  
  messagesStore.push(message);
  chat.updatedAt = new Date().toISOString();
  
  console.log('📤 Отправка сообщения:', message);
  console.log('👥 Участники чата:', chat.participantIds);
  
  // ОТПРАВЛЯЕМ ЧЕРЕЗ WEBSOCKET ВСЕМ УЧАСТНИКАМ ЧАТА (включая отправителя)
  if (io && chat.participantIds) {
    chat.participantIds.forEach((participantId: number) => {
      console.log(` Отправляем newMessage пользователю ${participantId}`);
      io.to(`user_${participantId}`).emit('newMessage', {
        chatId,
        message,
        chatName: chat.name
      });
    });
  }
  
  res.status(201).json({ success: true, data: message });
  return;
}));

export default router;
