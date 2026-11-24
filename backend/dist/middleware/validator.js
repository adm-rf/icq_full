"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = exports.schemas = void 0;
const zod_1 = require("zod");
// Схемы валидации
exports.schemas = {
    login: zod_1.z.object({
        email: zod_1.z.string().email('Некорректный email').max(254),
        password: zod_1.z.string().min(6, 'Пароль минимум 6 символов').max(128),
    }),
    register: zod_1.z.object({
        username: zod_1.z.string()
            .min(2, 'Имя минимум 2 символа')
            .max(50, 'Имя максимум 50 символов')
            .regex(/^[a-zA-Zа-яА-Я0-9_\s-]+$/, 'Имя содержит недопустимые символы'),
        email: zod_1.z.string().email('Некорректный email').max(254),
        password: zod_1.z.string().min(6, 'Пароль минимум 6 символов').max(128),
    }),
    profile: zod_1.z.object({
        username: zod_1.z.string()
            .min(2, 'Имя минимум 2 символа')
            .max(50, 'Имя максимум 50 символов')
            .regex(/^[a-zA-Zа-яА-Я0-9_\s-]+$/, 'Имя содержит недопустимые символы')
            .optional(),
        status: zod_1.z.string().max(200, 'Статус максимум 200 символов').optional(),
    }),
    message: zod_1.z.object({
        content: zod_1.z.string()
            .min(1, 'Сообщение не может быть пустым')
            .max(4000, 'Сообщение максимум 4000 символов'),
        type: zod_1.z.enum(['text', 'image', 'file']).optional(),
    }),
};
// Middleware-фабрика
const validate = (schema) => {
    return (req, res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
            res.status(400).json({
                success: false,
                message: 'Ошибка валидации',
                errors,
            });
            return;
        }
        req.body = result.data;
        next();
    };
};
exports.validate = validate;
//# sourceMappingURL=validator.js.map