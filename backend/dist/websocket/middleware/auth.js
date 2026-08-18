"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wsAuthMiddleware = wsAuthMiddleware;
exports.getAuthenticatedUser = getAuthenticatedUser;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../../config/env");
const errorHandler_1 = require("../../utils/errorHandler");
const logger_1 = __importDefault(require("../../utils/logger"));
/**
 * Middleware для аутентификации WebSocket подключений
 * Проверяет JWT токен при подключении
 */
function wsAuthMiddleware(socket, next) {
    try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            logger_1.default.warn(`⚠️ WebSocket connection attempt without token from ${socket.handshake.address}`);
            return next(new errorHandler_1.UnauthorizedError('Authentication required'));
        }
        // Верификация токена
        const decoded = jsonwebtoken_1.default.verify(token, env_1.config.JWT_SECRET);
        // Добавляем пользователя в объект сокета
        socket.user = {
            id: decoded.userId,
            email: decoded.email,
            username: decoded.username,
        };
        logger_1.default.debug(`✅ WebSocket authenticated: user ${decoded.username} (${socket.id})`);
        next();
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            logger_1.default.warn(`⚠️ Invalid JWT token: ${error.message}`);
            return next(new errorHandler_1.UnauthorizedError('Invalid token'));
        }
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            logger_1.default.warn(`⚠️ Expired JWT token`);
            return next(new errorHandler_1.UnauthorizedError('Token expired'));
        }
        logger_1.default.error(`❌ WebSocket auth error:`, error);
        next(new errorHandler_1.UnauthorizedError('Authentication failed'));
    }
}
/**
 * Helper для получения пользователя из сокета
 */
function getAuthenticatedUser(socket) {
    const authSocket = socket;
    if (!authSocket.user) {
        throw new errorHandler_1.UnauthorizedError('User not authenticated');
    }
    return authSocket.user;
}
//# sourceMappingURL=auth.js.map