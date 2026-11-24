import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Разрешаем безопасные теги (если вдруг придёт HTML)
purify.setConfig({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre'],
  ALLOWED_ATTR: [],
});

export const sanitizeText = (input: string): string => {
  if (typeof input !== 'string') return '';
  // Удаляем HTML-теги и потенциальные XSS
  return purify.sanitize(input.trim());
};

export const sanitizeUsername = (input: string): string => {
  if (typeof input !== 'string') return '';
  return input.trim().substring(0, 50);
};
