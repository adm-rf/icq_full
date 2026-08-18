import { Server, Socket } from 'socket.io';
import { SendMessagePayload } from '../events';
/**
 * Обработчик отправки сообщения через WebSocket
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет отправителя
 * @param payload - данные сообщения
 */
export declare function handleMessageSend(io: Server, socket: Socket, payload: SendMessagePayload): Promise<void>;
/**
 * Обработчик отметки о прочтении сообщения
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет пользователя
 * @param payload - данные о прочтении
 */
export declare function handleMessageRead(io: Server, socket: Socket, payload: {
    conversationId: number;
    messageId: number;
}): Promise<void>;
//# sourceMappingURL=message.d.ts.map