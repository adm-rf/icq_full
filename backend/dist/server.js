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
// Загрузка переменных окружения из .env
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const env_1 = require("./config/env");
const logger_1 = __importDefault(require("./utils/logger"));
const app_1 = require("./app");
/**
 * Точка входа в приложение
 */
async function main() {
    try {
        // Инициализация приложения
        const { httpServer } = await (0, app_1.initializeApp)();
        // Запуск сервера
        httpServer.listen(env_1.config.PORT, () => {
            logger_1.default.info(`🚀 Server is running on port ${env_1.config.PORT}`);
            logger_1.default.info(`📡 Environment: ${env_1.config.NODE_ENV}`);
            logger_1.default.info(`🌐 API URL: ${env_1.config.API_URL}`);
            logger_1.default.info(`💾 Database: ${env_1.config.DB_NAME} on ${env_1.config.DB_HOST}:${env_1.config.DB_PORT}`);
        });
        // Обработка неперехваченных ошибок
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.default.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
        // Graceful shutdown
        const gracefulShutdown = (signal) => {
            logger_1.default.info(`\n${signal} received. Shutting down gracefully...`);
            httpServer.close(() => {
                logger_1.default.info('HTTP server closed.');
                process.exit(0);
            });
            // Force close after 10 seconds
            setTimeout(() => {
                logger_1.default.error('Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Запуск приложения
main();
//# sourceMappingURL=server.js.map