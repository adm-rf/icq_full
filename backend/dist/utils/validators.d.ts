import { ZodSchema } from 'zod';
/**
 * Валидация данных запроса с помощью Zod
 * @param schema - Zod схема для валидации
 * @returns Middleware функция для Express
 */
export declare function validateRequest<T extends ZodSchema>(schema: T): (req: any, res: any, next: any) => void;
/**
 * Валидация только тела запроса
 */
export declare function validateBody<T extends ZodSchema>(schema: T): (req: any, res: any, next: any) => void;
/**
 * Валидация только query параметров
 */
export declare function validateQuery<T extends ZodSchema>(schema: T): (req: any, res: any, next: any) => void;
/**
 * Валидация только path параметров
 */
export declare function validateParams<T extends ZodSchema>(schema: T): (req: any, res: any, next: any) => void;
//# sourceMappingURL=validators.d.ts.map