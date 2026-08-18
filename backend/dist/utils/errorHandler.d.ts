import { Request, Response, NextFunction } from 'express';
/**
 * Класс для кастомных ошибок приложения
 */
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly isOperational: boolean;
    constructor(message: string, statusCode?: number, isOperational?: boolean);
}
/**
 * Ошибки для различных HTTP статусов
 */
export declare class BadRequestError extends AppError {
    constructor(message?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class NotFoundError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class TooManyRequestsError extends AppError {
    constructor(message?: string);
}
/**
 * Глобальный обработчик ошибок Express
 */
export declare function errorHandler(err: Error | AppError, req: Request, res: Response, _next: NextFunction): void;
/**
 * Асинхронный wrapper для обработки ошибок в async/await контроллерах
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errorHandler.d.ts.map