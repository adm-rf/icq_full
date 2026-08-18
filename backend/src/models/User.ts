import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import bcrypt from 'bcryptjs';

interface UserAttributes {
  id: number;
  email: string;
  username: string;
  password: string;
  avatarUrl?: string | null;
  status?: string;
  lastSeen?: Date | null;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'avatarUrl' | 'status' | 'lastSeen'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public email!: string;
  public username!: string;
  public password!: string;
  public avatarUrl!: string | null;
  public status!: string;
  public lastSeen!: Date | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Instance method to compare password
  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
  }

  // Hook to hash password before saving
  public static async hashPassword(user: User): Promise<void> {
    if (user.changed('password')) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
    }
  }

  // Hide password in JSON responses
  public override toJSON(): Record<string, unknown> {
    const values = { ...this.get() };
    delete (values as { password?: string }).password;
    return values;
  }
  
  // Dynamic methods from belongsToMany association with Conversation
  public addConversations!: (conversations: any[] | number[]) => Promise<void>;
  public removeConversations!: (conversations: any[] | number[]) => Promise<void>;
  public setConversations!: (conversations: any[] | number[]) => Promise<void>;
  public getConversations!: () => Promise<any[]>;
  public hasConversations!: (conversations: any[] | number[]) => Promise<boolean>;
  public countConversations!: () => Promise<number>;
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
      validate: {
        len: [2, 50],
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    avatarUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'offline',
    },
    lastSeen: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // createdAt and updatedAt are handled by timestamps option in init config
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeCreate: User.hashPassword,
      beforeUpdate: User.hashPassword,
    },
  }
);

export default User;
