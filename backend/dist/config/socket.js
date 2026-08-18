"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureSocketIO = configureSocketIO;
const socket_io_1 = require("socket.io");
const env_1 = require("./env");
const logger_1 = __importDefault(require("../utils/logger"));
const connection_1 = require("../websocket/handlers/connection");
const auth_1 = require("../websocket/middleware/auth");
/**
 * Настройка и конфигурация Socket.IO сервера
 */
function configureSocketIO(httpServer) {
    const corsOrigins = env_1.config.SOCKET_CORS_ORIGIN.split(',');
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: corsOrigins,
            methods: ['GET', 'POST'],
            credentials: true,
        },
        pingTimeout: 60000,
        pingInterval: 25000,
        // TODO: Добавить адаптер Redis для масштабирования
        // adapter: require('socket.io-redis'),
    });
    // Глобальный middleware для аутентификации
    io.use(auth_1.wsAuthMiddleware);
    // Логирование подключений
    io.on('connection', (socket) => {
        logger_1.default.info(`🔌 Socket connected: ${socket.id}`);
        socket.on('disconnect', (reason) => {
            logger_1.default.info(`🔌 Socket disconnected: ${socket.id} - Reason: ${reason}`);
        });
        socket.on('error', (error) => {
            logger_1.default.error(`❌ Socket error: ${socket.id}`, error);
        });
    });
    // Настройка обработчиков событий
    (0, connection_1.setupWebSocketHandlers)(io);
    logger_1.default.info('✅ Socket.IO configured successfully');
    return io;
}
//# sourceMappingURL=socket.js.map