import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { config } from './config/env';
import logger from './utils/logger';
import { errorHandler } from './utils/errorHandler';
import { setupAssociations } from './models';
import { testConnection } from './config/database';
import { configureSocketIO } from './config/socket';

// Импорт роутов
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import conversationRoutes from './routes/conversations';

/**
 * Создание и настройка Express приложения
 */
export function createApp(): express.Application {
  const app = express();

  // Безопасность
  app.use(helmet());
  
  // CORS
  app.use(cors({
    origin: config.SOCKET_CORS_ORIGIN.split(','),
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: {
      success: false,
      error: {
        code: 429,
        message: 'Too many requests, please try again later.',
      },
    },
  });
  app.use('/api/', limiter);

  // Парсинг тела запроса
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/conversations', conversationRoutes);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 404,
        message: `Route ${req.method} ${req.path} not found`,
      },
    });
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}

/**
 * Инициализация приложения
 */
export async function initializeApp(): Promise<{ app: express.Application; io: any }> {
  logger.info('🚀 Starting application initialization...');

  // Тест подключения к БД
  await testConnection();

  // Настройка ассоциаций моделей
  setupAssociations();

  // Создание Express приложения
  const app = createApp();

  // Создание HTTP сервера
  const httpServer = require('http').createServer(app);

  // Настройка Socket.IO
  const io = configureSocketIO(httpServer);

  logger.info('✅ Application initialized successfully');

  return { app, io, httpServer };
}
