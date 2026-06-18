import { z } from 'zod';

/**
 * Schema для валидации переменных окружения
 * Все поля обязательны для продакшена, некоторые имеют дефолты для dev
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_URL: z.string().url(),
  
  // Database
  DB_HOST: z.string().default('localhost'),
  DB_PORT: z.string().transform(Number).default('5432'),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_DIALECT: z.string().default('postgres'),
  DB_LOGGING: z.string().transform((v) => v === 'true').default('false'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
JWT_REFRESH_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  
  // Socket.IO
  SOCKET_CORS_ORIGIN: z.string(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  LOG_FILE: z.string().default('logs/app.log'),
  
  // Security
  BCRYPT_SALT_ROUNDS: z.string().transform(Number).default('10'),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Валидация и парсинг переменных окружения
 * @throws {Error} Если переменные не проходят валидацию
 */
export function validateEnv(): EnvConfig {
  const result = envSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    throw new Error('Environment validation failed');
  }
  
  return result.data;
}

// Экспортируем конфигурацию сразу после валидации
export const config = validateEnv();
