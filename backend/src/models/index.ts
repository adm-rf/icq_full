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
export function setupAssociations(): void {
  // User <-> Conversation (через таблицу участников)
  // TODO: Создать модель ConversationMember для связи многие-ко-многим
  
  // User <-> Message
  User.hasMany(Message, { 
    foreignKey: 'senderId', 
    as: 'sentMessages',
    onDelete: 'CASCADE',
  });
  
  Message.belongsTo(User, { 
    foreignKey: 'senderId', 
    as: 'sender',
  });
  
  // Conversation <-> Message
  Conversation.hasMany(Message, { 
    foreignKey: 'conversationId', 
    as: 'messages',
    onDelete: 'CASCADE',
  });
  
  Message.belongsTo(Conversation, { 
    foreignKey: 'conversationId', 
    as: 'conversation',
  });
  
  // Conversation creator
  Conversation.belongsTo(User, { 
    foreignKey: 'createdBy', 
    as: 'creator',
  });
  
  User.hasMany(Conversation, { 
    foreignKey: 'createdBy', 
    as: 'createdConversations',
  });
  
  // TODO: Добавить ConversationMember модель для участников чата
  // Conversation.belongsToMany(User, { through: 'conversation_members', as: 'members' });
  // User.belongsToMany(Conversation, { through: 'conversation_members', as: 'conversations' });
}

export default {
  User,
  Conversation,
  Message,
  setupAssociations,
};
