import { Sequelize } from 'sequelize';
import { env } from './env';
import logger from '../utils/logger';
import { defineAssociations } from '../models';

const sequelize = new Sequelize({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    logger.info('✅ Database connection established successfully.');
    
    // Define model associations before sync
    defineAssociations();
    
    // Sync all models with database (creates tables if they don't exist)
    // In production, use migrations instead
    await sequelize.sync({ alter: env.NODE_ENV === 'development' });
    logger.info('✅ Database synchronized successfully.');
  } catch (error) {
    logger.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize;
