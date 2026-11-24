"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUsername = exports.sanitizeText = void 0;
const dompurify_1 = __importDefault(require("dompurify"));
const jsdom_1 = require("jsdom");
const window = new jsdom_1.JSDOM('').window;
const purify = (0, dompurify_1.default)(window);
// Разрешаем безопасные теги (если вдруг придёт HTML)
purify.setConfig({
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre'],
    ALLOWED_ATTR: [],
});
const sanitizeText = (input) => {
    if (typeof input !== 'string')
        return '';
    // Удаляем HTML-теги и потенциальные XSS
    return purify.sanitize(input.trim());
};
exports.sanitizeText = sanitizeText;
const sanitizeUsername = (input) => {
    if (typeof input !== 'string')
        return '';
    return input.trim().substring(0, 50);
};
exports.sanitizeUsername = sanitizeUsername;
//# sourceMappingURL=sanitize.js.map