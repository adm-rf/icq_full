import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';

class Conversation extends Model {
  declare id: number;
  declare type: string;
  declare name: string | null;
  declare participantIds: number[];
  declare createdBy: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Conversation.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: DataTypes.STRING, allowNull: false, defaultValue: 'group' },
    name: { type: DataTypes.STRING, allowNull: true },
    participantIds: { type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false, defaultValue: [] },
    createdBy: { type: DataTypes.INTEGER, allowNull: true },
  },
  { sequelize, modelName: 'Conversation', tableName: 'Conversations' }
);

export default Conversation;
