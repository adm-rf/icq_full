"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sequelize = void 0;
exports.testConnection = testConnection;
exports.syncDatabase = syncDatabase;
const sequelize_1 = require("sequelize");
const env_1 = require("./env");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Конфигурация подключения Sequelize
 */
const sequelizeConfig = {
    host: env_1.config.DB_HOST,
    port: env_1.config.DB_PORT,
    dialect: env_1.config.DB_DIALECT,
    logging: env_1.config.DB_LOGGING ? (msg) => logger_1.default.debug(msg) : false,
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
    // TODO: Добавить SSL для production
    // ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};
/**
 * Экземпляр Sequelize для подключения к PostgreSQL
 */
exports.sequelize = new sequelize_1.Sequelize(env_1.config.DB_NAME, env_1.config.DB_USER, env_1.config.DB_PASSWORD, sequelizeConfig);
/**
 * Проверка подключения к базе данных
 */
async function testConnection() {
    try {
        await exports.sequelize.authenticate();
        logger_1.default.info('✅ Database connection established successfully.');
    }
    catch (error) {
        logger_1.default.error('❌ Unable to connect to the database:', error);
        throw error;
    }
}
/**
 * Синхронизация моделей с базой данных
 * @param force - Если true, таблицы будут пересозданы (ОПАСНО в production!)
 */
async function syncDatabase(force = false) {
    try {
        await exports.sequelize.sync({ force });
        logger_1.default.info('✅ Database synchronized successfully.');
    }
    catch (error) {
        logger_1.default.error('❌ Database synchronization failed:', error);
        throw error;
    }
}
exports.default = exports.sequelize;
//# sourceMappingURL=database.js.map