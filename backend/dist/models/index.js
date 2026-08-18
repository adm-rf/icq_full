"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = exports.Conversation = exports.User = void 0;
exports.setupAssociations = setupAssociations;
const User_1 = __importDefault(require("./User"));
exports.User = User_1.default;
const Conversation_1 = __importDefault(require("./Conversation"));
exports.Conversation = Conversation_1.default;
const Message_1 = __importDefault(require("./Message"));
exports.Message = Message_1.default;
/**
 * Установка ассоциаций между моделями
 * Вызывается один раз при инициализации приложения
 */
function setupAssociations() {
    // User <-> Conversation (через таблицу участников)
    // TODO: Создать модель ConversationMember для связи многие-ко-многим
    // User <-> Message
    User_1.default.hasMany(Message_1.default, {
        foreignKey: 'senderId',
        as: 'sentMessages',
        onDelete: 'CASCADE',
    });
    Message_1.default.belongsTo(User_1.default, {
        foreignKey: 'senderId',
        as: 'sender',
    });
    // Conversation <-> Message
    Conversation_1.default.hasMany(Message_1.default, {
        foreignKey: 'conversationId',
        as: 'messages',
        onDelete: 'CASCADE',
    });
    Message_1.default.belongsTo(Conversation_1.default, {
        foreignKey: 'conversationId',
        as: 'conversation',
    });
    // Conversation creator
    Conversation_1.default.belongsTo(User_1.default, {
        foreignKey: 'createdBy',
        as: 'creator',
    });
    User_1.default.hasMany(Conversation_1.default, {
        foreignKey: 'createdBy',
        as: 'createdConversations',
    });
    // TODO: Добавить ConversationMember модель для участников чата
    // Conversation.belongsToMany(User, { through: 'conversation_members', as: 'members' });
    // User.belongsToMany(Conversation, { through: 'conversation_members', as: 'conversations' });
}
exports.default = {
    User: User_1.default,
    Conversation: Conversation_1.default,
    Message: Message_1.default,
    setupAssociations,
};
//# sourceMappingURL=index.js.map