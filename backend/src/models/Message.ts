import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  FILE = 'file',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
}

interface MessageAttributes {
  id: number;
  content: string;
  type: MessageType;
  senderId: number;
  senderName: string;
  conversationId: number;
  status: MessageStatus;
  readAt?: Date | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

interface MessageCreationAttributes extends Optional<MessageAttributes, 'id' | 'type' | 'status' | 'readAt'> {}

class Message extends Model<MessageAttributes, MessageCreationAttributes> implements MessageAttributes {
  public id!: number;
  public content!: string;
  public type!: MessageType;
  public senderId!: number;
  public senderName!: string;
  public conversationId!: number;
  public status!: MessageStatus;
  public readAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations will be defined in index.ts
  public sender?: User;
  public conversation?: Conversation;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('text', 'image', 'file'),
      defaultValue: MessageType.TEXT,
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    senderName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'conversations',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('sent', 'delivered', 'read'),
      defaultValue: MessageStatus.SENT,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // createdAt and updatedAt are handled by timestamps option in init config
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    indexes: [
      {
        fields: ['conversationId'],
      },
      {
        fields: ['senderId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['createdAt'],
      },
    ],
  }
);

export default Message;
