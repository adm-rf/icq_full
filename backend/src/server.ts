// Загрузка переменных окружения из .env
import * as dotenv from 'dotenv';
dotenv.config();

import { config } from './config/env';
import logger from './utils/logger';
import { initializeApp } from './app';

/**
 * Точка входа в приложение
 */
async function main(): Promise<void> {
  try {
    // Инициализация приложения
    const { httpServer } = await initializeApp();

    // Запуск сервера
    httpServer.listen(config.PORT, () => {
      logger.info(`🚀 Server is running on port ${config.PORT}`);
      logger.info(`📡 Environment: ${config.NODE_ENV}`);
      logger.info(`🌐 API URL: ${config.API_URL}`);
      logger.info(`💾 Database: ${config.DB_NAME} on ${config.DB_HOST}:${config.DB_PORT}`);
    });

    // Обработка неперехваченных ошибок
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      httpServer.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Запуск приложения
main();
