import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import _User from './User';

/**
 * Атрибуты чата/конверсации
 */
export interface ConversationAttributes {
  id?: number;
  name?: string | null;
  type: 'direct' | 'group';
  avatarUrl?: string | null;
  createdBy?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Атрибуты для создания конверсации
 */
export interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * Модель конверсации (чата)
 */
class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: number;
  public name!: string | null;
  public type!: 'direct' | 'group';
  public avatarUrl!: string | null;
  public createdBy!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Ассоциации будут установлены в index.ts
  // TODO: Добавить методы для получения участников
  // TODO: Добавить методы для получения последних сообщений
}

Conversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true,
      // Для group чатов имя обязательно, для direct - опционально
    },
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
      defaultValue: 'direct',
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['type'] },
      { fields: ['createdBy'] },
    ],
  }
);

// Ассоциации будут определены после импорта всех моделей
// Conversation.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

export default Conversation;
