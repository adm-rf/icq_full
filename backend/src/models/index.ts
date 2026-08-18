import User from './User';
import Conversation from './Conversation';
import Message from './Message';

// Define associations between models
export const defineAssociations = (): void => {
  // User <-> Conversation (Many-to-Many through conversation_participants)
  User.belongsToMany(Conversation, {
    through: 'conversation_participants',
    foreignKey: 'userId',
    as: 'conversations',
  });

  Conversation.belongsToMany(User, {
    through: 'conversation_participants',
    foreignKey: 'conversationId',
    as: 'participants',
  });

  // Conversation created by User
  Conversation.belongsTo(User, {
    foreignKey: 'createdBy',
    as: 'creator',
  });

  // Message belongs to Sender (User) and Conversation
  Message.belongsTo(User, {
    foreignKey: 'senderId',
    as: 'sender',
  });

  Message.belongsTo(Conversation, {
    foreignKey: 'conversationId',
    as: 'conversation',
  });

  // Conversation has many Messages
  Conversation.hasMany(Message, {
    foreignKey: 'conversationId',
    as: 'messages',
    onDelete: 'CASCADE',
  });

  // User has many Messages (as sender)
  User.hasMany(Message, {
    foreignKey: 'senderId',
    as: 'sentMessages',
  });
};

// Export all models
export { default as User } from './User';
export { default as Conversation } from './Conversation';
export { default as Message, MessageStatus, MessageType } from './Message';
