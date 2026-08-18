"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
class Conversation extends sequelize_1.Model {
}
Conversation.init({
    id: { type: sequelize_1.DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    type: { type: sequelize_1.DataTypes.STRING, allowNull: false, defaultValue: 'group' },
    name: { type: sequelize_1.DataTypes.STRING, allowNull: true },
    participantIds: { type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.INTEGER), allowNull: false, defaultValue: [] },
    createdBy: { type: sequelize_1.DataTypes.INTEGER, allowNull: true },
}, { sequelize: database_1.default, modelName: 'Conversation', tableName: 'Conversations' });
exports.default = Conversation;
//# sourceMappingURL=Conversation.js.map