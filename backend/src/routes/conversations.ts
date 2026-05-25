import { Router, Request } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { validateBody, validateParams } from '../utils/validators';
import { z } from 'zod';

const router = Router();

interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

// Схемы валидации
const createConversationSchema = z.object({
  body: z.object({
    type: z.enum(['direct', 'group']),
    name: z.string().min(1).max(100).optional(),
    participantIds: z.array(z.number()).min(1),
  }),
});

const sendMessageSchema = z.object({
  body: z.object({
    content: z.string().min(1).max(5000),
    type: z.enum(['text', 'image', 'file', 'voice']).optional().default('text'),
  }),
});

/**
 * GET /api/conversations
 * Получение списка чатов текущего пользователя
 */
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res) => {
    // TODO: Реализовать получение списка чатов
    // 1. Получить userId из токена
    // 2. Найти все чаты, где пользователь является участником
    // 3. Для каждого чата получить последнее сообщение
    // 4. Вернуть список с пагинацией
    
    res.status(200).json({
      success: true,
      message: 'Get conversations endpoint - TODO: implement',
      data: [],
    });
  })
);

/**
 * POST /api/conversations
 * Создание нового чата
 * 
 * Request Body:
 * - type: 'direct' | 'group'
 * - name?: string (обязательно для group)
 * - participantIds: number[]
 */
router.post(
  '/',
  validateBody(createConversationSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    // TODO: Реализовать создание чата
    // 1. Валидировать данные
    // 2. Создать conversation
    // 3. Добавить участников (через ConversationMember)
    // 4. Вернуть созданный чат
    
    res.status(201).json({
      success: true,
      message: 'Create conversation endpoint - TODO: implement',
      data: {},
    });
  })
);

/**
 * GET /api/conversations/:id
 * Получение информации о чате
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    
    // TODO: Реализовать получение чата по ID
    // 1. Проверить права доступа (участник ли?)
    // 2. Получить информацию о чате
    // 3. Получить список участников
    // 4. Вернуть данные
    
    res.status(200).json({
      success: true,
      message: `Get conversation ${id} endpoint - TODO: implement`,
      data: { id: Number(id) },
    });
  })
);

/**
 * PUT /api/conversations/:id
 * Обновление информации о чате
 */
router.put(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    
    // TODO: Реализовать обновление чата
    // 1. Проверить права (администратор ли?)
    // 2. Обновить данные чата
    // 3. Вернуть обновленные данные
    
    res.status(200).json({
      success: true,
      message: `Update conversation ${id} endpoint - TODO: implement`,
      data: {},
    });
  })
);

/**
 * DELETE /api/conversations/:id
 * Удаление/покидание чата
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    
    // TODO: Реализовать удаление/покидание чата
    // 1. Проверить права
    // 2. Если group - удалить пользователя из участников
    // 3. Если direct - пометить как удаленный для пользователя
    // 4. Если creator и group - удалить чат полностью
    
    res.status(200).json({
      success: true,
      message: `Delete conversation ${id} endpoint - TODO: implement`,
    });
  })
);

/**
 * GET /api/conversations/:id/messages
 * Получение сообщений чата с пагинацией
 * 
 * Query params:
 * - limit?: number (default: 50)
 * - before?: string (дата/ID для пагинации)
 */
router.get(
  '/:id/messages',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { limit = 50, before } = req.query;
    
    // TODO: Реализовать получение сообщений
    // 1. Проверить права доступа
    // 2. Получить сообщения с пагинацией
    // 3. Отсортировать по createdAt DESC
    // 4. Вернуть сообщения
    
    res.status(200).json({
      success: true,
      message: `Get messages for conversation ${id} endpoint - TODO: implement`,
      data: { conversationId: Number(id), limit, before },
    });
  })
);

/**
 * POST /api/conversations/:id/messages
 * Отправка сообщения в чат
 * 
 * Request Body:
 * - content: string
 * - type?: 'text' | 'image' | 'file' | 'voice'
 */
router.post(
  '/:id/messages',
  validateBody(sendMessageSchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    const { content, type = 'text' } = req.body;
    
    // TODO: Реализовать отправку сообщения
    // 1. Проверить права доступа (участник ли?)
    // 2. Создать сообщение в БД
    // 3. Отправить через WebSocket всем участникам
    // 4. Вернуть созданное сообщение
    
    res.status(201).json({
      success: true,
      message: `Send message to conversation ${id} endpoint - TODO: implement`,
      data: { conversationId: Number(id), content, type },
    });
  })
);

/**
 * POST /api/conversations/:conversationId/messages/:messageId/read
 * Отметка сообщения как прочитанного
 */
router.post(
  '/:conversationId/messages/:messageId/read',
  asyncHandler(async (req: AuthRequest, res) => {
    const { conversationId, messageId } = req.params;
    
    // TODO: Реализовать отметку о прочтении
    // 1. Проверить права
    // 2. Обновить status = 'read' и readAt = now
    // 3. Отправить WebSocket событие другим участникам
    
    res.status(200).json({
      success: true,
      message: `Mark message ${messageId} as read endpoint - TODO: implement`,
    });
  })
);

export default router;
