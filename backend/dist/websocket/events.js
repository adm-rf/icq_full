"use strict";
/**
 * WebSocket события - enum для типизации событий
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerEvents = exports.ClientEvents = void 0;
/** События от клиента к серверу (Client -> Server) */
var ClientEvents;
(function (ClientEvents) {
    // Аутентификация
    ClientEvents["AUTHENTICATE"] = "auth:authenticate";
    // Сообщения
    ClientEvents["MESSAGE_SEND"] = "message:send";
    ClientEvents["MESSAGE_READ"] = "message:read";
    ClientEvents["MESSAGE_TYPING"] = "message:typing";
    // Конверсации
    ClientEvents["CONVERSATION_JOIN"] = "conversation:join";
    ClientEvents["CONVERSATION_LEAVE"] = "conversation:leave";
    // Присутствие
    ClientEvents["PRESENCE_UPDATE"] = "presence:update";
})(ClientEvents || (exports.ClientEvents = ClientEvents = {}));
/** События от сервера к клиенту (Server -> Client) */
var ServerEvents;
(function (ServerEvents) {
    // Аутентификация
    ServerEvents["AUTH_SUCCESS"] = "auth:success";
    ServerEvents["AUTH_ERROR"] = "auth:error";
    // Сообщения
    ServerEvents["MESSAGE_NEW"] = "message:new";
    ServerEvents["MESSAGE_DELIVERED"] = "message:delivered";
    ServerEvents["MESSAGE_READ"] = "message:read";
    ServerEvents["MESSAGE_TYPING"] = "message:typing";
    ServerEvents["MESSAGE_ERROR"] = "message:error";
    // Конверсации
    ServerEvents["CONVERSATION_UPDATED"] = "conversation:updated";
    ServerEvents["CONVERSATION_USER_JOINED"] = "conversation:user_joined";
    ServerEvents["CONVERSATION_USER_LEFT"] = "conversation:user_left";
    // Присутствие
    ServerEvents["PRESENCE_UPDATE"] = "presence:update";
    ServerEvents["PRESENCE_STATUS"] = "presence:status";
    // Ошибки
    ServerEvents["ERROR"] = "error";
})(ServerEvents || (exports.ServerEvents = ServerEvents = {}));
//# sourceMappingURL=events.js.map