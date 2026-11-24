import { z, ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Схемы валидации
export const schemas = {
  login: z.object({
    email: z.string().email('Некорректный email').max(254),
    password: z.string().min(6, 'Пароль минимум 6 символов').max(128),
  }),

  register: z.object({
    username: z.string()
      .min(2, 'Имя минимум 2 символа')
      .max(50, 'Имя максимум 50 символов')
      .regex(/^[a-zA-Zа-яА-Я0-9_\s-]+$/, 'Имя содержит недопустимые символы'),
    email: z.string().email('Некорректный email').max(254),
    password: z.string().min(6, 'Пароль минимум 6 символов').max(128),
  }),

  profile: z.object({
    username: z.string()
      .min(2, 'Имя минимум 2 символа')
      .max(50, 'Имя максимум 50 символов')
      .regex(/^[a-zA-Zа-яА-Я0-9_\s-]+$/, 'Имя содержит недопустимые символы')
      .optional(),
    status: z.string().max(200, 'Статус максимум 200 символов').optional(),
  }),

  message: z.object({
    content: z.string()
      .min(1, 'Сообщение не может быть пустым')
      .max(4000, 'Сообщение максимум 4000 символов'),
    type: z.enum(['text', 'image', 'file']).optional(),
  }),
};

// Middleware-фабрика
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      res.status(400).json({
        success: false,
        message: 'Ошибка валидации',
        errors,
      });
      return;
    }
    req.body = result.data;
    next();
  };
};
