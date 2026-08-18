"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = __importDefault(require("winston"));
const env_1 = require("../config/env");
/**
 * Форматтер для логирования с цветом и временем
 */
const customFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
}));
/**
 * Конфигурация Winston logger
 */
const logger = winston_1.default.createLogger({
    level: env_1.config.LOG_LEVEL,
    format: customFormat,
    transports: [
        // Консольный транспорт для всех сред
        new winston_1.default.transports.Console({
            format: winston_1.default.format.combine(winston_1.default.format.colorize(), customFormat),
        }),
        // Файловый транспорт для ошибок (все среды)
        new winston_1.default.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Файловый транспорт для всех логов (только production)
        ...(env_1.config.NODE_ENV === 'production'
            ? [
                new winston_1.default.transports.File({
                    filename: env_1.config.LOG_FILE,
                    maxsize: 5242880, // 5MB
                    maxFiles: 10,
                }),
            ]
            : []),
    ],
});
// TODO: Добавить транспорт для отправки логов в外部ние системы (Sentry, Logstash)
exports.default = logger;
//# sourceMappingURL=logger.js.map