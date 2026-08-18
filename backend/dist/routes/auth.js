"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../utils/errorHandler");
const validators_1 = require("../utils/validators");
const zod_1 = require("zod");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_1 = require("../config/env");
const User_1 = __importDefault(require("../models/User"));
const errorHandler_2 = require("../utils/errorHandler");
const router = (0, express_1.Router)();
// Схемы валидации
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    username: zod_1.z.string().min(3).max(50, 'Username must be between 3 and 50 characters'),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
/**
 * POST /api/auth/register — СОЗДАЁТ нового пользователя
 */
router.post('/register', (0, validators_1.validateBody)(registerSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, username, password } = req.body;
    // 1. Проверка: не существует ли уже пользователь с таким email
    const existingUser = await User_1.default.findOne({ where: { email } });
    if (existingUser) {
        throw new errorHandler_2.BadRequestError('User with this email already exists');
    }
    // 2. Хеширование пароля
    const passwordHash = await bcryptjs_1.default.hash(password, 10);
    // 3. Создание пользователя в БД
    const user = await User_1.default.create({
        email,
        username,
        passwordHash,
        status: 'offline',
    });
    // 4. Генерация JWT токенов
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.config.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    // 5. Ответ (без passwordHash!)
    const { passwordHash: _, ...userWithoutPassword } = user.toJSON();
    res.status(201).json({
        success: true,
        data: {
            user: userWithoutPassword,
            tokens: { accessToken, refreshToken },
        },
    });
}));
/**
 * POST /api/auth/login — ПРОВЕРЯЕТ существующего пользователя
 */
router.post('/login', (0, validators_1.validateBody)(loginSchema), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // 1. Поиск пользователя по email
    const user = await User_1.default.findOne({ where: { email } });
    if (!user) {
        throw new errorHandler_2.BadRequestError('Invalid email or password');
    }
    // 2. Проверка пароля
    const isValid = await bcryptjs_1.default.compare(password, user.getDataValue('passwordHash'));
    if (!isValid) {
        throw new errorHandler_2.BadRequestError('Invalid email or password');
    }
    // 3. Генерация JWT токенов
    const accessToken = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email }, env_1.config.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.config.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    // 4. Обновление lastSeenAt
    user.lastSeenAt = new Date();
    await user.save();
    // 5. Ответ
    const { passwordHash: _, ...userWithoutPassword } = user.toJSON();
    res.json({
        success: true,
        data: {
            user: userWithoutPassword,
            tokens: { accessToken, refreshToken },
        },
    });
}));
/**
 * POST /api/auth/logout
 */
router.post('/logout', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Logout endpoint - TODO: implement',
    });
}));
/**
 * POST /api/auth/refresh
 */
router.post('/refresh', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Refresh token endpoint - TODO: implement',
    });
}));
exports.default = router;
//# sourceMappingURL=auth.js.map