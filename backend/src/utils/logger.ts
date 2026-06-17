import winston from 'winston';
import { config } from '../config/env';

/**
 * Форматтер для логирования с цветом и временем
 */
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

/**
 * Конфигурация Winston logger
 */
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: customFormat,
  transports: [
    // Консольный транспорт для всех сред
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        customFormat
      ),
    }),
    
    // Файловый транспорт для ошибок (все среды)
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Файловый транспорт для всех логов (только production)
    ...(config.NODE_ENV === 'production'
      ? [
          new winston.transports.File({
            filename: config.LOG_FILE,
            maxsize: 5242880, // 5MB
            maxFiles: 10,
          }),
        ]
      : []),
  ],
});

// TODO: Добавить транспорт для отправки логов в外部ние системы (Sentry, Logstash)

export default logger;
