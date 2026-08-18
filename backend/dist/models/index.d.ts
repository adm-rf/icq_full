import User from './User';
import Conversation from './Conversation';
import Message from './Message';
/**
 * Экспорт всех моделей для удобного импорта
 */
export { User, Conversation, Message };
/**
 * Установка ассоциаций между моделями
 * Вызывается один раз при инициализации приложения
 */
export declare function setupAssociations(): void;
declare const _default: {
    User: typeof User;
    Conversation: typeof Conversation;
    Message: typeof Message;
    setupAssociations: typeof setupAssociations;
};
export default _default;
//# sourceMappingURL=index.d.ts.map