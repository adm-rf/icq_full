"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Message extends sequelize_1.Model {
}
Message.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    conversationId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false },
    senderId: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    senderName: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'User' },
    content: { type: sequelize_1.DataTypes.TEXT, allowNull: false, defaultValue: '' },
    type: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'text' },
    status: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'sent' },
    readAt: { type: sequelize_1.DataTypes.DATE, allowNull: true, defaultValue: null },
}, { sequelize: database_1.default, modelName: 'Message', tableName: 'Messages', updatedAt: false });
exports.default = Message;
//# sourceMappingURL=Message.js.map