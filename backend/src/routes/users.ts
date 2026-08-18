import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { asyncHandler, AppError } from '../utils/errorHandler';
import User from '../models/User';

interface JwtPayload {
  userId: number;
}

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization token required', 401);
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    (req as any).userId = decoded.userId;

    next();
  } catch (error) {
    if ((error as any).name === 'JsonWebTokenError') {
      next(new AppError('Invalid token', 401));
    } else if ((error as any).name === 'TokenExpiredError') {
      next(new AppError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

const router = Router();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
  '/profile',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const userId = (req as any).userId;
    const { username, avatarUrl } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    await user.update({
      username: username || user.username,
      avatarUrl: avatarUrl !== undefined ? avatarUrl : user.avatarUrl,
    });

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * @route   GET /api/users
 * @desc    Get all users (for contact list)
 * @access  Private
 */
router.get(
  '/',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const currentUserId = (req as any).userId;

    const users = await User.findAll({
      where: {
        id: { $ne: currentUserId },
      },
      attributes: ['id', 'username', 'email', 'avatarUrl', 'status', 'lastSeen'],
    });

    res.json({
      success: true,
      data: { users },
    });
  })
);

/**
 * @route   GET /api/users/:userId
 * @desc    Get user by ID
 * @access  Private
 */
router.get(
  '/:userId',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'email', 'avatarUrl', 'status', 'lastSeen'],
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  })
);

export default router;
