import { Server } from 'socket.io';
import { config } from './env';
import logger from '../utils/logger';
import { setupWebSocketHandlers } from '../websocket/handlers/connection';
import { wsAuthMiddleware } from '../websocket/middleware/auth';

/**
 * Настройка и конфигурация Socket.IO сервера
 */
export function configureSocketIO(httpServer: any): Server {
  const corsOrigins = config.SOCKET_CORS_ORIGIN.split(',');
  
  const io = new Server(httpServer, {
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
  io.use(wsAuthMiddleware);

  // Логирование подключений
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);
    
    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} - Reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`❌ Socket error: ${socket.id}`, error);
    });
  });

  // Настройка обработчиков событий
  setupWebSocketHandlers(io);

  logger.info('✅ Socket.IO configured successfully');
  
  return io;
}

export type { Server as SocketIOServer };
