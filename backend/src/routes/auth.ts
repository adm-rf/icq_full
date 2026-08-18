import { Router } from 'express';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import User from '../models/User';
import { asyncHandler, AppError } from '../utils/errorHandler';
import { registerValidator, loginValidator } from '../utils/validators';
import logger from '../utils/logger';

const router = Router();

// Generate JWT token
const generateToken = (userId: number): string => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as any);
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  registerValidator,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, username, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Create user
    const user = await User.create({
      email,
      username,
      password,
    });

    logger.info(`New user registered: ${user.email}`);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
    });
  })
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  loginValidator,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(errors.array()[0].msg, 400);
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate token
    const token = generateToken(user.id);

    // Update last seen and status
    await user.update({
      lastSeen: new Date(),
      status: 'online',
    });

    logger.info(`User logged in: ${user.email}`);

    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  })
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get(
  '/me',
  asyncHandler(async (req, res) => {
    // User ID is set by auth middleware (to be added)
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

export default router;
