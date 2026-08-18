import { Model, Optional } from 'sequelize';
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
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'createdAt' | 'updatedAt'> {
}
declare class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
    id: number;
    email: string;
    username: string;
    passwordHash: string;
    avatarUrl: string | null;
    status: string;
    lastSeenAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export default User;
//# sourceMappingURL=User.d.ts.map