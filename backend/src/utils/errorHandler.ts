import { Request, Response, NextFunction } from 'express';
import logger from './logger';

/**
 * Класс для кастомных ошибок приложения
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Ошибки для различных HTTP статусов
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict') {
    super(message, 409);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests') {
    super(message, 429);
  }
}

/**
 * Глобальный обработчик ошибок Express
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Логирование ошибки
  logger.error(`❌ ${req.method} ${req.path}`, {
    error: err.message,
    stack: err.stack,
    userId: (req as any).user?.id,
  });

  // Обработка известных операционных ошибок
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.statusCode,
      },
    });
    return;
  }

  // Обработка ошибок Sequelize
  if (err.name === 'SequelizeValidationError') {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation Error',
        code: 400,
        // TODO: Распарсить ошибки валидации Sequelize
      },
    });
    return;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    res.status(409).json({
      success: false,
      error: {
        message: 'Resource already exists',
        code: 409,
      },
    });
    return;
  }

  // Неизвестные ошибки - 500
  res.status(500).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal Server Error' 
        : err.message,
      code: 500,
    },
  });
}

/**
 * Асинхронный wrapper для обработки ошибок в async/await контроллерах
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
