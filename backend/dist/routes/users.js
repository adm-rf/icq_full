"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandler_1 = require("../utils/errorHandler");
const User_1 = __importDefault(require("../models/User"));
const router = (0, express_1.Router)();
// GET /api/users - получить список всех пользователей
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    try {
        const users = await User_1.default.findAll({
            attributes: ['id', 'username', 'email', 'status', 'avatarUrl', 'createdAt', 'updatedAt']
        });
        res.json({
            success: true,
            data: users.map(u => ({
                id: u.id,
                username: u.username,
                email: u.email,
                status: u.status || 'offline',
                avatarUrl: u.avatarUrl,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt
            }))
        });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
    return;
}));
// GET /api/users/:id - получить пользователя по ID
router.get('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User_1.default.findByPk(id, {
            attributes: ['id', 'username', 'email', 'status', 'avatarUrl', 'createdAt', 'updatedAt']
        });
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.json({
            success: true,
            data: {
                id: user.id,
                username: user.username,
                email: user.email,
                status: user.status || 'offline',
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
    return;
}));
exports.default = router;
//# sourceMappingURL=users.js.map