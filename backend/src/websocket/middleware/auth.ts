import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../../config/env';
import { UnauthorizedError } from '../../utils/errorHandler';
import logger from '../../utils/logger';

/**
 * Расширяем интерфейс Socket для добавления пользователя
 */
interface AuthSocket extends Socket {
  user?: {
    id: number;
    email: string;
    username: string;
  };
}

/**
 * JWT Payload интерфейс
 */
interface JWTPayload {
  userId: number;
  email: string;
  username: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware для аутентификации WebSocket подключений
 * Проверяет JWT токен при подключении
 */
export function wsAuthMiddleware(
  socket: AuthSocket,
  next: (err?: Error) => void
): void {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      logger.warn(`⚠️ WebSocket connection attempt without token from ${socket.handshake.address}`);
      return next(new UnauthorizedError('Authentication required'));
    }

    // Верификация токена
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

    // Добавляем пользователя в объект сокета
    socket.user = {
      id: decoded.userId,
      email: decoded.email,
      username: decoded.username,
    };

    logger.debug(`✅ WebSocket authenticated: user ${decoded.username} (${socket.id})`);
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn(`⚠️ Invalid JWT token: ${error.message}`);
      return next(new UnauthorizedError('Invalid token'));
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn(`⚠️ Expired JWT token`);
      return next(new UnauthorizedError('Token expired'));
    }

    logger.error(`❌ WebSocket auth error:`, error);
    next(new UnauthorizedError('Authentication failed'));
  }
}

/**
 * Helper для получения пользователя из сокета
 */
export function getAuthenticatedUser(socket: Socket): { id: number; email: string; username: string } {
  const authSocket = socket as AuthSocket;
  
  if (!authSocket.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  
  return authSocket.user;
}
