import { Server, Socket } from 'socket.io';
import { ConversationJoinPayload } from '../events';
/**
 * Обработчик присоединения пользователя к чату
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет пользователя
 * @param payload - данные о чате
 */
export declare function handleConversationJoin(io: Server, socket: Socket, payload: ConversationJoinPayload): Promise<void>;
/**
 * Обработчик покидания чата пользователем
 * @param io - экземпляр Socket.IO сервера
 * @param socket - сокет пользователя
 * @param payload - данные о чате
 */
export declare function handleConversationLeave(io: Server, socket: Socket, payload: ConversationJoinPayload): Promise<void>;
//# sourceMappingURL=conversation.d.ts.map