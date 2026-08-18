import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import logger from '../../utils/logger';

interface JwtPayload {
  userId: number;
}

export const wsAuthMiddleware = (
  socket: Socket,
  next: (err?: Error) => void
): void => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      logger.warn('WebSocket connection attempt without token');
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token as string, env.JWT_SECRET) as JwtPayload;
    (socket as any).userId = decoded.userId;

    logger.debug(`WebSocket authenticated for user ${decoded.userId}`);
    next();
  } catch (error) {
    logger.error('WebSocket authentication failed:', error);
    next(new Error('Invalid or expired token'));
  }
};
