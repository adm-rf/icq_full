import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Message from './Message';

interface ConversationAttributes {
  id: number;
  name?: string | null;
  type: 'direct' | 'group';
  createdBy: number;
  // Store participant IDs as array for quick access (also stored in junction table)
  participantIds: number[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

interface ConversationCreationAttributes extends Optional<ConversationAttributes, 'id' | 'name' | 'participantIds'> {}

class Conversation extends Model<ConversationAttributes, ConversationCreationAttributes> implements ConversationAttributes {
  public id!: number;
  public name!: string | null;
  public type!: 'direct' | 'group';
  public createdBy!: number;
  public participantIds!: number[];
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Associations will be defined in index.ts
  public creator?: User;
  public participants?: User[];
  public messages?: Message[];
  
  // Dynamic methods from belongsToMany association
  public addParticipants!: (users: User[] | number[]) => Promise<void>;
  public removeParticipants!: (users: User[] | number[]) => Promise<void>;
  public setParticipants!: (users: User[] | number[]) => Promise<void>;
  public getParticipants!: () => Promise<User[]>;
  public hasParticipants!: (users: User[] | number[]) => Promise<boolean>;
  public countParticipants!: () => Promise<number>;
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
    },
    type: {
      type: DataTypes.ENUM('direct', 'group'),
      allowNull: false,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    participantIds: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: false,
      defaultValue: [],
    },
    // createdAt and updatedAt are handled by timestamps option in init config
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    indexes: [
      {
        fields: ['createdBy'],
      },
      {
        fields: ['type'],
      },
      {
        fields: ['participantIds'],
        using: 'gin',
      },
    ],
  }
);

export default Conversation;
