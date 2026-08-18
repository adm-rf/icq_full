"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
// Убрали public class fields - они конфликтовали с Sequelize
class User extends sequelize_1.Model {
}
User.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    username: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { len: [3, 50] },
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: 'password_hash',
    },
    avatarUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: 'offline',
    },
    lastSeenAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
    },
}, {
    sequelize: database_1.default,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['email'] },
        { fields: ['username'] },
    ],
});
exports.default = User;
//# sourceMappingURL=User.js.map