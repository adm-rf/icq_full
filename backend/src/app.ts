import express, { Express } from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import sequelize from './config/database';
import logger from './utils/logger';
import { errorHandler } from './utils/errorHandler';

// Импортируем ВСЕ модели (это нужно для sequelize.sync)
import User from './models/User';
import Conversation from './models/Conversation';
import Message from './models/Message';

// Импорт роутов
import authRoutes from './routes/auth';
import conversationsRoutes, { setSocketIO } from './routes/conversations';
import usersRoutes from './routes/users';

export interface AppComponents {
  app: Express;
  httpServer: http.Server;
  io: SocketIOServer;
}

export async function initializeApp(): Promise<AppComponents> {
  logger.info('🚀 Starting application initialization...');

  const app = express();
  const httpServer = http.createServer(app);

  // CORS middleware
  app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  }));

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Backend is running',
      timestamp: new Date().toISOString()
    });
  });

  // Подключаем роуты
  app.use('/api/auth', authRoutes);
  logger.info('✅ Auth routes loaded');

  app.use('/api/conversations', conversationsRoutes);
  logger.info('✅ Conversations routes loaded');

  app.use('/api/users', usersRoutes);
  logger.info('✅ Users routes loaded');

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
  app.use(errorHandler);

  // Database connection
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');

    // Синхронизация моделей (создает таблицы Conversations и Messages)
    await sequelize.sync({ alter: true });
    logger.info('✅ Database synced');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }

  // Socket.IO setup с улучшенными настройками стабильности
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    connectTimeout: 30000
  });

  // Map для отслеживания онлайн-пользователей: userId -> socketId[]
  const onlineUsers = new Map<number, string[]>();

  // Передаем io в роуты conversations
  setSocketIO(io);

  // Обработчики WebSocket соединений
  io.on('connection', (socket) => {
    logger.info(`🔌 New WebSocket connection: ${socket.id}`);
    
    socket.on('register', (userId: number) => {
      socket.join(`user_${userId}`);
      
      // Добавляем сокет в список пользователя
      const userSockets = onlineUsers.get(userId) || [];
      userSockets.push(socket.id);
      onlineUsers.set(userId, userSockets);
      
      logger.info(`👤 User ${userId} registered on socket ${socket.id}`);
      logger.info(`📊 Online users: ${Array.from(onlineUsers.entries()).map(([id, sockets]) => `${id}:${sockets.length}`).join(', ')}`);
      
      // Уведомляем всех о том, что пользователь онлайн
      socket.broadcast.emit('userOnline', { userId });
    });
    
    socket.on('joinChat', (chatId: number) => {
      socket.join(`chat_${chatId}`);
      logger.info(`💬 Socket ${socket.id} joined chat ${chatId}`);
    });
    
    socket.on('disconnect', (reason) => {
      logger.info(`❌ WebSocket disconnected: ${socket.id}, reason: ${reason}`);
      
      // Находим пользователя по socket.id и удаляем сокет из списка
      let disconnectedUserId: number | null = null;
      for (const [userId, sockets] of onlineUsers.entries()) {
        const index = sockets.indexOf(socket.id);
        if (index !== -1) {
          sockets.splice(index, 1);
          if (sockets.length === 0) {
            onlineUsers.delete(userId);
            disconnectedUserId = userId;
          } else {
            onlineUsers.set(userId, sockets);
          }
          break;
        }
      }
      
      // Если у пользователя больше нет сокетов - уведомляем об offline
      if (disconnectedUserId !== null) {
        logger.info(`🔴 User ${disconnectedUserId} went offline`);
        socket.broadcast.emit('userOffline', { userId: disconnectedUserId });
      }
      
      logger.info(`📊 Online users after disconnect: ${Array.from(onlineUsers.entries()).map(([id, sockets]) => `${id}:${sockets.length}`).join(', ')}`);
    });
  });

  logger.info('✅ Socket.IO configured successfully');
  logger.info('✅ Application initialized successfully');

  return { app, httpServer, io };
}

export default initializeApp;
