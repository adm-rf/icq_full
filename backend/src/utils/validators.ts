import { z, ZodSchema } from 'zod';
import { BadRequestError } from './errorHandler';

/**
 * Валидация данных запроса с помощью Zod
 * @param schema - Zod схема для валидации
 * @returns Middleware функция для Express
 */
export function validateRequest<T extends ZodSchema>(schema: T) {
  return (req: any, res: any, next: any): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new BadRequestError(
        `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
      );
    }

    // Добавляем валидированные данные в request
    req.validatedData = result.data;
    next();
  };
}

/**
 * Валидация только тела запроса
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return (req: any, res: any, next: any): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new BadRequestError(
        `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
      );
    }

    req.body = result.data;
    next();
  };
}

/**
 * Валидация только query параметров
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return (req: any, res: any, next: any): void => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new BadRequestError(
        `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
      );
    }

    req.query = result.data;
    next();
  };
}

/**
 * Валидация только path параметров
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return (req: any, res: any, next: any): void => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));
      
      throw new BadRequestError(
        `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`
      );
    }

    req.params = result.data;
    next();
  };
}

// TODO: Добавить валидацию для WebSocket payload
