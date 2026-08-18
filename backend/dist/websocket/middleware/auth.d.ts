import { Socket } from 'socket.io';
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
 * Middleware для аутентификации WebSocket подключений
 * Проверяет JWT токен при подключении
 */
export declare function wsAuthMiddleware(socket: AuthSocket, next: (err?: Error) => void): void;
/**
 * Helper для получения пользователя из сокета
 */
export declare function getAuthenticatedUser(socket: Socket): {
    id: number;
    email: string;
    username: string;
};
export {};
//# sourceMappingURL=auth.d.ts.map