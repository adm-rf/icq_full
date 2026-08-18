import { z } from 'zod';
/**
 * Schema для валидации переменных окружения
 * Все поля обязательны для продакшена, некоторые имеют дефолты для dev
 */
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    API_URL: z.ZodString;
    DB_HOST: z.ZodDefault<z.ZodString>;
    DB_PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    DB_NAME: z.ZodString;
    DB_USER: z.ZodString;
    DB_PASSWORD: z.ZodString;
    DB_DIALECT: z.ZodDefault<z.ZodString>;
    DB_LOGGING: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
    JWT_SECRET: z.ZodString;
    JWT_REFRESH_SECRET: z.ZodString;
    JWT_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    JWT_REFRESH_EXPIRES_IN: z.ZodDefault<z.ZodString>;
    SOCKET_CORS_ORIGIN: z.ZodString;
    RATE_LIMIT_WINDOW_MS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    RATE_LIMIT_MAX_REQUESTS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    LOG_FILE: z.ZodDefault<z.ZodString>;
    BCRYPT_SALT_ROUNDS: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
}, "strip", z.ZodTypeAny, {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    API_URL: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_DIALECT: string;
    DB_LOGGING: boolean;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    SOCKET_CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    LOG_FILE: string;
    BCRYPT_SALT_ROUNDS: number;
}, {
    API_URL: string;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    SOCKET_CORS_ORIGIN: string;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    PORT?: string | undefined;
    DB_HOST?: string | undefined;
    DB_PORT?: string | undefined;
    DB_DIALECT?: string | undefined;
    DB_LOGGING?: string | undefined;
    JWT_EXPIRES_IN?: string | undefined;
    JWT_REFRESH_EXPIRES_IN?: string | undefined;
    RATE_LIMIT_WINDOW_MS?: string | undefined;
    RATE_LIMIT_MAX_REQUESTS?: string | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
    LOG_FILE?: string | undefined;
    BCRYPT_SALT_ROUNDS?: string | undefined;
}>;
export type EnvConfig = z.infer<typeof envSchema>;
/**
 * Валидация и парсинг переменных окружения
 * @throws {Error} Если переменные не проходят валидацию
 */
export declare function validateEnv(): EnvConfig;
export declare const config: {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    API_URL: string;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
    DB_DIALECT: string;
    DB_LOGGING: boolean;
    JWT_SECRET: string;
    JWT_REFRESH_SECRET: string;
    JWT_EXPIRES_IN: string;
    JWT_REFRESH_EXPIRES_IN: string;
    SOCKET_CORS_ORIGIN: string;
    RATE_LIMIT_WINDOW_MS: number;
    RATE_LIMIT_MAX_REQUESTS: number;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    LOG_FILE: string;
    BCRYPT_SALT_ROUNDS: number;
};
export {};
//# sourceMappingURL=env.d.ts.map