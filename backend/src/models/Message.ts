import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';

/**
 * Статусы прочтения сообщения
 */
export type MessageStatus = 'sent' | 'delivered' | 'read';

/**
 * Атрибуты сообщения
 */
export interface MessageAttributes {
  id?: number;
  conversationId: number;
  senderId: number;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  status: MessageStatus;
  readAt?: Date | null;
  deletedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Атрибуты для создания сообщения
 */
export interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'status' | 'readAt' | 'createdAt' | 'updatedAt'> {}

/**
 * Модель сообщения
 */
class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public conversationId!: number;
  public senderId!: number;
  public content!: string;
  public type!: 'text' | 'image' | 'file' | 'voice';
  public status!: MessageStatus;
  public readAt!: Date | null;
  public deletedAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Ассоциации будут установлены в index.ts
  // TODO: Добавить методы для отметки о прочтении
  // TODO: Добавить методы для мягкого удаления
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      // TODO: Добавить валидацию длины и sanitization
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file', 'voice'),
      allowNull: false,
      defaultValue: 'text',
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read'),
      allowNull: false,
      defaultValue: 'sent',
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      // TODO: Настроить paranoid mode для мягкого удаления
    },
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['conversationId'] },
      { fields: ['senderId'] },
      { fields: ['status'] },
      { fields: ['createdAt'] },
    ],
  }
);

// Ассоциации будут определены после импорта всех моделей
// Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
// Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

export default Message;
