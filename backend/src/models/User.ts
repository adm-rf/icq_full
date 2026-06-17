import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

/**
 * Атрибуты пользователя для создания
 */
export interface UserAttributes {
  id?: number;
  email: string;
  username: string;
  passwordHash: string;
  avatarUrl?: string | null;
  status?: string;
  lastSeenAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Атрибуты пользователя для обновления (все поля опциональны)
 */
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

/**
 * Модель пользователя
 */
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public username!: string;
  public passwordHash!: string;
  public avatarUrl!: string | null;
  public status!: string;
  public lastSeenAt!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Методы экземпляра (будут добавлены позже)
  // TODO: Добавить метод для проверки пароля
  // TODO: Добавить метод для генерации JWT токена
  // TODO: Добавить метод для обновления lastSeenAt
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      minLength: 3,
      maxLength: 50,
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'offline',
      // TODO: Добавить enum: 'online', 'offline', 'away', 'busy'
    },
    lastSeenAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['username'] },
    ],
  }
);

export default User;
