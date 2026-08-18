import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { env } from './env';
import logger from '../utils/logger';
import { handleConnection } from '../websocket/handlers/connection';
import { handleMessage } from '../websocket/handlers/message';
import { handleConversation } from '../websocket/handlers/conversation';
import { wsAuthMiddleware } from '../websocket/middleware/auth';

let io: SocketIOServer | null = null;

export const initializeSocketIO = (server: HTTPServer): SocketIOServer => {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Global middleware for authentication
  io.use(wsAuthMiddleware);

  io.on('connection', async (socket: Socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // Handle connection (async - updates user status in DB)
    await handleConnection(socket, io!);
    
    // Handle messages and conversation events
    handleMessage(socket, io!);
    handleConversation(socket, io!);

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id}, reason: ${reason}`);
    });

    socket.on('error', (error) => {
      logger.error(`⚠️ Socket error: ${socket.id}`, error);
    });
  });

  logger.info(`🚀 Socket.IO server initialized on port ${env.PORT}`);

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocketIO first.');
  }
  return io;
};
