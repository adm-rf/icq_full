import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

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

export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {}

// Убрали public class fields - они конфликтовали с Sequelize
class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: number;
  declare email: string;
  declare username: string;
  declare passwordHash: string;
  declare avatarUrl: string | null;
  declare status: string;
  declare lastSeenAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
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
      validate: { isEmail: true },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { len: [3, 50] },
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash',
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
