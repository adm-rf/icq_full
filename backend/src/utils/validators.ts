import { body, param, query, ValidationChain } from 'express-validator';

export const registerValidator: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
];

export const loginValidator: ValidationChain[] = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const userIdValidator: ValidationChain[] = [
  param('userId').isInt({ min: 1 }).withMessage('Valid user ID is required'),
];

export const conversationIdValidator: ValidationChain[] = [
  param('conversationId')
    .isInt({ min: 1 })
    .withMessage('Valid conversation ID is required'),
];

export const createMessageValidator: ValidationChain[] = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 2000 })
    .withMessage('Message content must not exceed 2000 characters'),
  body('conversationId')
    .isInt({ min: 1 })
    .withMessage('Valid conversation ID is required'),
];

export const createConversationValidator: ValidationChain[] = [
  body('name').optional().trim().isLength({ max: 100 }),
  body('type').isIn(['direct', 'group']).withMessage('Type must be direct or group'),
  body('participantIds')
    .isArray({ min: 1 })
    .withMessage('At least one participant is required'),
  body('participantIds.*').isInt({ min: 1 }).withMessage('Invalid participant ID'),
];

export const searchValidator: ValidationChain[] = [
  query('q')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
];

export const messageIdValidator: ValidationChain[] = [
  param('messageId')
    .isInt({ min: 1 })
    .withMessage('Valid message ID is required'),
];
