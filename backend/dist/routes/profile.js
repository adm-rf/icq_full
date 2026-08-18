"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../utils/errorHandler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const upload_1 = require("../middleware/upload");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'Нет токена' });
        return;
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ success: false, message: 'Токен пустой' });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
        req.userId = decoded.userId || decoded.id || decoded.sub;
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, message: 'Невалидный токен' });
    }
};
router.use(authMiddleware);
// GET /api/profile - данные текущего пользователя
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const user = await User_1.default.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'status', 'avatarUrl', 'lastSeenAt', 'createdAt']
    });
    if (!user) {
        res.status(404).json({ success: false, message: 'Пользователь не найден' });
        return;
    }
    res.json({ success: true, data: user.toJSON() });
    return;
}));
// PUT /api/profile - обновить username/status
router.put('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const { username, status } = req.body || {};
    const user = await User_1.default.findByPk(userId);
    if (!user) {
        res.status(404).json({ success: false, message: 'Пользователь не найден' });
        return;
    }
    if (username)
        user.username = username;
    if (status)
        user.status = status;
    await user.save();
    res.json({ success: true, data: user.toJSON() });
    return;
}));
// POST /api/profile/avatar - загрузить аватар
router.post('/avatar', upload_1.upload.single('avatar'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Файл не загружен' });
        return;
    }
    const user = await User_1.default.findByPk(userId);
    if (!user) {
        res.status(404).json({ success: false, message: 'Пользователь не найден' });
        return;
    }
    if (user.avatarUrl) {
        const oldPath = path_1.default.join(__dirname, '../../', user.avatarUrl);
        if (fs_1.default.existsSync(oldPath))
            fs_1.default.unlinkSync(oldPath);
    }
    const avatarUrl = `uploads/${req.file.filename}`;
    user.avatarUrl = avatarUrl;
    await user.save();
    res.json({ success: true, data: { avatarUrl } });
    return;
}));
// DELETE /api/profile/avatar - удалить аватар
router.delete('/avatar', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const user = await User_1.default.findByPk(userId);
    if (!user) {
        res.status(404).json({ success: false, message: 'Пользователь не найден' });
        return;
    }
    if (user.avatarUrl) {
        const oldPath = path_1.default.join(__dirname, '../../', user.avatarUrl);
        if (fs_1.default.existsSync(oldPath))
            fs_1.default.unlinkSync(oldPath);
    }
    user.avatarUrl = null;
    await user.save();
    res.json({ success: true, message: 'Аватар удалён' });
    return;
}));
exports.default = router;
//# sourceMappingURL=profile.js.map