"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
/**
 * Schema для валидации переменных окружения
 * Все поля обязательны для продакшена, некоторые имеют дефолты для dev
 */
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.string().transform(Number).default('3000'),
    API_URL: zod_1.z.string().url(),
    // Database
    DB_HOST: zod_1.z.string().default('localhost'),
    DB_PORT: zod_1.z.string().transform(Number).default('5432'),
    DB_NAME: zod_1.z.string(),
    DB_USER: zod_1.z.string(),
    DB_PASSWORD: zod_1.z.string(),
    DB_DIALECT: zod_1.z.string().default('postgres'),
    DB_LOGGING: zod_1.z.string().transform((v) => v === 'true').default('false'),
    // JWT
    JWT_SECRET: zod_1.z.string().min(32),
    JWT_REFRESH_SECRET: zod_1.z.string().min(32),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default('30d'),
    // Socket.IO
    SOCKET_CORS_ORIGIN: zod_1.z.string(),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
    // Logging
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
    LOG_FILE: zod_1.z.string().default('logs/app.log'),
    // Security
    BCRYPT_SALT_ROUNDS: zod_1.z.string().transform(Number).default('10'),
});
/**
 * Валидация и парсинг переменных окружения
 * @throws {Error} Если переменные не проходят валидацию
 */
function validateEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        console.error(result.error.format());
        throw new Error('Environment validation failed');
    }
    return result.data;
}
// Экспортируем конфигурацию сразу после валидации
exports.config = validateEnv();
//# sourceMappingURL=env.js.map