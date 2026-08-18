import { Sequelize } from 'sequelize';
/**
 * Экземпляр Sequelize для подключения к PostgreSQL
 */
export declare const sequelize: Sequelize;
/**
 * Проверка подключения к базе данных
 */
export declare function testConnection(): Promise<void>;
/**
 * Синхронизация моделей с базой данных
 * @param force - Если true, таблицы будут пересозданы (ОПАСНО в production!)
 */
export declare function syncDatabase(force?: boolean): Promise<void>;
export default sequelize;
//# sourceMappingURL=database.d.ts.map