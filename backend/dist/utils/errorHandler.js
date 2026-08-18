"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TooManyRequestsError = exports.ConflictError = exports.NotFoundError = exports.ForbiddenError = exports.UnauthorizedError = exports.BadRequestError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const logger_1 = __importDefault(require("./logger"));
/**
 * Класс для кастомных ошибок приложения
 */
class AppError extends Error {
    statusCode;
    isOperational;
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
/**
 * Ошибки для различных HTTP статусов
 */
class BadRequestError extends AppError {
    constructor(message = 'Bad Request') {
        super(message, 400);
    }
}
exports.BadRequestError = BadRequestError;
class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(message, 401);
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}
exports.ForbiddenError = ForbiddenError;
class NotFoundError extends AppError {
    constructor(message = 'Not Found') {
        super(message, 404);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Conflict') {
        super(message, 409);
    }
}
exports.ConflictError = ConflictError;
class TooManyRequestsError extends AppError {
    constructor(message = 'Too Many Requests') {
        super(message, 429);
    }
}
exports.TooManyRequestsError = TooManyRequestsError;
/**
 * Глобальный обработчик ошибок Express
 */
function errorHandler(err, req, res, _next) {
    // Логирование ошибки
    logger_1.default.error(`❌ ${req.method} ${req.path}`, {
        error: err.message,
        stack: err.stack,
        userId: req.user?.id,
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
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errorHandler.js.map