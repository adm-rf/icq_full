import { Router, Request } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { z } from 'zod';

const router = Router();

// Расширяем тип Request для добавления пользователя
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

// Схемы валидации
const updateProfileSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    avatarUrl: z.string().url().optional().nullable(),
    status: z.enum(['online', 'offline', 'away', 'busy']).optional(),
  }),
});

/**
 * GET /api/users/profile
 * Получение профиля текущего пользователя
 */
router.get(
  '/profile',
  asyncHandler(async (req: AuthRequest, res) => {
    // TODO: Реализовать получение профиля
    // 1. Получить userId из токена (req.user)
    // 2. Найти пользователя в БД
    // 3. Вернуть данные профиля
    
    res.status(200).json({
      success: true,
      message: 'Get profile endpoint - TODO: implement',
      data: {
        // Пример данных
        id: 1,
        email: 'user@example.com',
        username: 'username',
        avatarUrl: null,
        status: 'offline',
      },
    });
  })
);

/**
 * PUT /api/users/profile
 * Обновление профиля текущего пользователя
 * 
 * Request Body:
 * - username?: string
 * - avatarUrl?: string | null
 * - status?: 'online' | 'offline' | 'away' | 'busy'
 */
router.put(
  '/profile',
  asyncHandler(async (req: AuthRequest, res) => {
    // TODO: Реализовать обновление профиля
    // 1. Валидировать данные
    // 2. Обновить пользователя в БД
    // 3. Вернуть обновленные данные
    
    res.status(200).json({
      success: true,
      message: 'Update profile endpoint - TODO: implement',
      data: {},
    });
  })
);

/**
 * GET /api/users/:id
 * Получение профиля другого пользователя по ID
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthRequest, res) => {
    const { id } = req.params;
    
    // TODO: Реализовать получение профиля по ID
    // 1. Найти пользователя по ID
    // 2. Проверить права доступа
    // 3. Вернуть публичные данные пользователя
    
    res.status(200).json({
      success: true,
      message: `Get user ${id} endpoint - TODO: implement`,
      data: { id: Number(id) },
    });
  })
);

/**
 * GET /api/users/search
 * Поиск пользователей по query параметру
 * 
 * Query params:
 * - q: string (поисковой запрос)
 * - limit?: number
 * - offset?: number
 */
router.get(
  '/search',
  asyncHandler(async (req: AuthRequest, res) => {
    const { q, limit = 20, offset = 0 } = req.query;
    
    // TODO: Реализовать поиск пользователей
    // 1. Валидировать query параметры
    // 2. Поиск по username/email
    // 3. Вернуть список пользователей
    
    res.status(200).json({
      success: true,
      message: 'Search users endpoint - TODO: implement',
      data: { query: q, limit, offset },
    });
  })
);

export default router;
