"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.avatarLimiter = exports.registerLimiter = exports.loginLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Общее ограничение для API: 1000 запросов / 15 минут
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { success: false, message: 'Слишком много запросов, попробуйте позже' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Строгое для логина: 5 попыток / 15 минут
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Слишком много попыток входа. Подождите 15 минут' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Для регистрации: 3 аккаунта / час
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { success: false, message: 'Превышен лимит регистраций' },
    standardHeaders: true,
    legacyHeaders: false,
});
// Для загрузки аватаров: 20 / час
exports.avatarLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { success: false, message: 'Превышен лимит загрузки аватаров' },
    standardHeaders: true,
    legacyHeaders: false,
});
//# sourceMappingURL=rateLimiter.js.map