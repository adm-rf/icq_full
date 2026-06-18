import { Router } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import { validateBody } from '../utils/validators';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/env';

import User from '../models/User';
import { BadRequestError } from '../utils/errorHandler';

const router = Router();

// Схемы валидации
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3).max(50, 'Username must be between 3 and 50 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

/**
 * POST /api/auth/register — СОЗДАЁТ нового пользователя
 */
router.post(
  '/register',
  validateBody(registerSchema),
  asyncHandler(async (req, res) => {
    const { email, username, password } = req.body;

    // 1. Проверка: не существует ли уже пользователь с таким email
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new BadRequestError('User with this email already exists');
    }

    // 2. Хеширование пароля
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Создание пользователя в БД
    const user = await User.create({
      email,
      username,
      passwordHash,
      status: 'offline',
    });

    // 4. Генерация JWT токенов
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Ответ (без passwordHash!)
    const { passwordHash: _, ...userWithoutPassword } = user.toJSON();
    
    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
        tokens: { accessToken, refreshToken },
      },
    });
  })
);

/**
 * POST /api/auth/login — ПРОВЕРЯЕТ существующего пользователя
 */
router.post(
  '/login',
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // 1. Поиск пользователя по email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestError('Invalid email or password');
    }

    // 2. Проверка пароля
    const isValid = await bcrypt.compare(password, user.getDataValue('passwordHash'));
    if (!isValid) {
      throw new BadRequestError('Invalid email or password');
    }

    // 3. Генерация JWT токенов
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: user.id },
      config.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // 4. Обновление lastSeenAt
    user.lastSeenAt = new Date();
    await user.save();

    // 5. Ответ
    const { passwordHash: _, ...userWithoutPassword } = user.toJSON();
    
    res.json({
      success: true,
      data: {
        user: userWithoutPassword,
        tokens: { accessToken, refreshToken },
      },
    });
  })
);

/**
 * POST /api/auth/logout
 */
router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Logout endpoint - TODO: implement',
    });
  })
);

/**
 * POST /api/auth/refresh
 */
router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Refresh token endpoint - TODO: implement',
    });
  })
);

export default router;
