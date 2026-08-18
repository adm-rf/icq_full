"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.validateBody = validateBody;
exports.validateQuery = validateQuery;
exports.validateParams = validateParams;
const errorHandler_1 = require("./errorHandler");
/**
 * Валидация данных запроса с помощью Zod
 * @param schema - Zod схема для валидации
 * @returns Middleware функция для Express
 */
function validateRequest(schema) {
    return (req, res, next) => {
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
            throw new errorHandler_1.BadRequestError(`Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`);
        }
        // Добавляем валидированные данные в request
        req.validatedData = result.data;
        next();
    };
}
/**
 * Валидация только тела запроса
 */
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            throw new errorHandler_1.BadRequestError(`Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`);
        }
        req.body = result.data;
        next();
    };
}
/**
 * Валидация только query параметров
 */
function validateQuery(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const errors = result.error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            throw new errorHandler_1.BadRequestError(`Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`);
        }
        req.query = result.data;
        next();
    };
}
/**
 * Валидация только path параметров
 */
function validateParams(schema) {
    return (req, res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const errors = result.error.errors.map((err) => ({
                field: err.path.join('.'),
                message: err.message,
            }));
            throw new errorHandler_1.BadRequestError(`Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`);
        }
        req.params = result.data;
        next();
    };
}
// TODO: Добавить валидацию для WebSocket payload
//# sourceMappingURL=validators.js.map