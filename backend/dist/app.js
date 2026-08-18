"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeApp = initializeApp;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const database_1 = __importDefault(require("./config/database"));
const logger_1 = __importDefault(require("./utils/logger"));
const errorHandler_1 = require("./utils/errorHandler");
// Импорт роутов
const auth_1 = __importDefault(require("./routes/auth"));
const conversations_1 = __importStar(require("./routes/conversations"));
const users_1 = __importDefault(require("./routes/users"));
const profile_1 = __importDefault(require("./routes/profile"));
const path_1 = __importDefault(require("path"));
async function initializeApp() {
    logger_1.default.info('🚀 Starting application initialization...');
    const app = (0, express_1.default)();
    const httpServer = http_1.default.createServer(app);
    // CORS middleware
    app.use((0, cors_1.default)({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
    }));
    // Body parser
    app.use(express_1.default.json());
    app.use(express_1.default.urlencoded({ extended: true }));
    // Статические файлы (аватары)
    app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            message: 'Backend is running',
            timestamp: new Date().toISOString()
        });
    });
    // Подключаем роуты
    app.use('/api/auth', auth_1.default);
    logger_1.default.info('✅ Auth routes loaded');
    app.use('/api/conversations', conversations_1.default);
    logger_1.default.info('✅ Conversations routes loaded');
    app.use('/api/users', users_1.default);
    logger_1.default.info('✅ Users routes loaded');
    app.use('/api/profile', profile_1.default);
    logger_1.default.info('✅ Profile routes loaded');
    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            success: false,
            error: {
                code: 404,
                message: `Route ${req.method} ${req.path} not found`
            }
        });
    });
    // Error handler
    app.use(errorHandler_1.errorHandler);
    // Database connection
    try {
        await database_1.default.authenticate();
        logger_1.default.info('✅ Database connection established successfully.');
        // Синхронизация моделей (создает таблицы Conversations и Messages)
        await database_1.default.sync({ alter: true });
        logger_1.default.info('✅ Database synced');
    }
    catch (error) {
        logger_1.default.error('❌ Database connection failed:', error);
        throw error;
    }
    // Socket.IO setup с улучшенными настройками стабильности
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        },
        pingInterval: 25000,
        pingTimeout: 20000,
        connectTimeout: 30000
    });
    // Map для отслеживания онлайн-пользователей: userId -> socketId[]
    const onlineUsers = new Map();
    // Передаем io в роуты conversations
    (0, conversations_1.setSocketIO)(io);
    // Обработчики WebSocket соединений
    io.on('connection', (socket) => {
        logger_1.default.info(`🔌 New WebSocket connection: ${socket.id}`);
        socket.on('register', (userId) => {
            socket.join(`user_${userId}`);
            // Добавляем сокет в список пользователя
            const userSockets = onlineUsers.get(userId) || [];
            userSockets.push(socket.id);
            onlineUsers.set(userId, userSockets);
            logger_1.default.info(`👤 User ${userId} registered on socket ${socket.id}`);
            logger_1.default.info(`📊 Online users: ${Array.from(onlineUsers.entries()).map(([id, sockets]) => `${id}:${sockets.length}`).join(', ')}`);
            // Уведомляем всех о том, что пользователь онлайн
            socket.broadcast.emit('userOnline', { userId });
        });
        socket.on('joinChat', (chatId) => {
            socket.join(`chat_${chatId}`);
            logger_1.default.info(`💬 Socket ${socket.id} joined chat ${chatId}`);
        });
        socket.on('disconnect', (reason) => {
            logger_1.default.info(`❌ WebSocket disconnected: ${socket.id}, reason: ${reason}`);
            // Находим пользователя по socket.id и удаляем сокет из списка
            let disconnectedUserId = null;
            for (const [userId, sockets] of onlineUsers.entries()) {
                const index = sockets.indexOf(socket.id);
                if (index !== -1) {
                    sockets.splice(index, 1);
                    if (sockets.length === 0) {
                        onlineUsers.delete(userId);
                        disconnectedUserId = userId;
                    }
                    else {
                        onlineUsers.set(userId, sockets);
                    }
                    break;
                }
            }
            // Если у пользователя больше нет сокетов - уведомляем об offline
            if (disconnectedUserId !== null) {
                logger_1.default.info(`🔴 User ${disconnectedUserId} went offline`);
                socket.broadcast.emit('userOffline', { userId: disconnectedUserId });
            }
            logger_1.default.info(`📊 Online users after disconnect: ${Array.from(onlineUsers.entries()).map(([id, sockets]) => `${id}:${sockets.length}`).join(', ')}`);
        });
    });
    logger_1.default.info('✅ Socket.IO configured successfully');
    logger_1.default.info('✅ Application initialized successfully');
    return { app, httpServer, io };
}
exports.default = initializeApp;
//# sourceMappingURL=app.js.map