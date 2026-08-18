import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Message extends Model {
  declare id: number;
  declare conversationId: number;
  declare senderId: number;
  declare senderName: string;
  declare content: string;
  declare type: string;
  declare status: string;
  declare readonly createdAt: Date;
}

Message.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    conversationId: { type: DataTypes.INTEGER, allowNull: false },
    senderId: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    senderName: { type: DataTypes.STRING, allowNull: false, defaultValue: 'User' },
    content: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'text' },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'sent' },
  },
  { sequelize, modelName: 'Message', tableName: 'Messages', updatedAt: false }
);

export default Message;
