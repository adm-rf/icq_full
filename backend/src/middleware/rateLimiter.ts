import rateLimit from 'express-rate-limit';

// Общее ограничение для API: 1000 запросов / 15 минут
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Слишком много запросов, попробуйте позже' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Строгое для логина: 5 попыток / 15 минут
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Слишком много попыток входа. Подождите 15 минут' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Для регистрации: 3 аккаунта / час
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Превышен лимит регистраций' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Для загрузки аватаров: 20 / час
export const avatarLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Превышен лимит загрузки аватаров' },
  standardHeaders: true,
  legacyHeaders: false,
});
