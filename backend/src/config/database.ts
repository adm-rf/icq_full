import { Sequelize } from 'sequelize';
import { config } from './env';
import logger from '../utils/logger';

/**
 * Конфигурация подключения Sequelize
 */
const sequelizeConfig = {
  host: config.DB_HOST,
  port: config.DB_PORT,
  dialect: config.DB_DIALECT as 'postgres' | 'mysql' | 'sqlite' | 'mssql',
  logging: config.DB_LOGGING ? (msg: string) => logger.debug(msg) : false,
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
export const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASSWORD,
  sequelizeConfig
);

/**
 * Проверка подключения к базе данных
 */
export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
}

/**
 * Синхронизация моделей с базой данных
 * @param force - Если true, таблицы будут пересозданы (ОПАСНО в production!)
 */
export async function syncDatabase(force = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    logger.info('✅ Database synchronized successfully.');
  } catch (error) {
    logger.error('❌ Database synchronization failed:', error);
    throw error;
  }
}

export default sequelize;
