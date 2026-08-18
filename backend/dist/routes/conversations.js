"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketIO = void 0;
const express_1 = require("express");
const errorHandler_1 = require("../utils/errorHandler");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Conversation_1 = __importDefault(require("../models/Conversation"));
const Message_1 = __importDefault(require("../models/Message"));
const router = (0, express_1.Router)();
let io = null;
const setSocketIO = (socketIO) => {
    io = socketIO;
};
exports.setSocketIO = setSocketIO;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        req.userId = null;
        return next();
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
        req.userId = null;
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
    }
    catch (error) {
        req.userId = null;
    }
    next();
};
router.use(authMiddleware);
// GET /api/conversations - список чатов из БД
router.get('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.userId;
    const all = await Conversation_1.default.findAll({ order: [['updatedAt', 'DESC']] });
    const mine = userId ? all.filter(c => (c.participantIds || []).includes(userId)) : all;
    const data = await Promise.all(mine.map(async (chat) => {
        const last = await Message_1.default.findOne({
            where: { conversationId: chat.id },
            order: [['createdAt', 'DESC']],
        });
        return {
            ...chat.toJSON(),
            lastMessage: last ? last.toJSON() : null,
            unreadCount: 0,
        };
    }));
    res.json({ success: true, data });
    return;
}));
// POST /api/conversations - создать чат в БД
router.post('/', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { type = 'group', name, participantIds = [] } = req.body || {};
    const creatorId = req.userId;
    let chatName = name;
    if (type === 'direct' && !chatName && participantIds.length > 0) {
        chatName = `Chat with User ${participantIds[0]}`;
    }
    const allParticipants = creatorId
        ? Array.from(new Set([creatorId, ...participantIds]))
        : participantIds;
    const chat = await Conversation_1.default.create({
        type,
        name: chatName || 'Новый чат',
        participantIds: allParticipants,
        createdBy: creatorId,
    });
    console.log('✅ Чат создан в БД, id:', chat.id);
    if (io) {
        allParticipants.forEach((uid) => {
            io.to(`user_${uid}`).emit('newChat', chat.toJSON());
        });
    }
    res.status(201).json({ success: true, data: chat.toJSON() });
    return;
}));
// DELETE /api/conversations/:id - удалить чат из БД
router.delete('/:id', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const chatId = Number(req.params.id);
    const chat = await Conversation_1.default.findByPk(chatId);
    if (chat) {
        const participants = chat.participantIds || [];
        await Message_1.default.destroy({ where: { conversationId: chatId } });
        await chat.destroy();
        if (io) {
            participants.forEach((uid) => {
                io.to(`user_${uid}`).emit('chatDeleted', { chatId });
            });
        }
    }
    res.json({ success: true, message: 'Chat deleted' });
    return;
}));
// GET /api/conversations/:id/messages - сообщения из БД
router.get('/:id/messages', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const chatId = Number(req.params.id);
    const msgs = await Message_1.default.findAll({
        where: { conversationId: chatId },
        order: [['createdAt', 'ASC']],
    });
    res.json({ success: true, data: msgs.map(m => m.toJSON()) });
    return;
}));
// POST /api/conversations/:id/messages - сохранить сообщение в БД
router.post('/:id/messages', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const chatId = Number(req.params.id);
    const { content, type = 'text', senderId, senderName } = req.body || {};
    const userId = req.userId;
    const chat = await Conversation_1.default.findByPk(chatId);
    if (!chat) {
        res.status(404).json({ success: false, message: 'Chat not found' });
        return;
    }
    const message = await Message_1.default.create({
        conversationId: chatId,
        content: content || '',
        type: type || 'text',
        senderId: senderId || userId || 1,
        senderName: senderName || 'User',
        status: 'sent',
    });
    console.log('📤 Сообщение сохранено в БД, id:', message.id);
    if (io) {
        (chat.participantIds || []).forEach((uid) => {
            io.to(`user_${uid}`).emit('newMessage', {
                chatId,
                message: message.toJSON(),
                chatName: chat.name,
            });
        });
    }
    res.status(201).json({ success: true, data: message.toJSON() });
    return;
}));
// PATCH /:id/messages/:messageId/delivered - сообщение доставлено
router.patch('/:id/messages/:messageId/delivered', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const messageId = Number(req.params.messageId);
    const message = await Message_1.default.findByPk(messageId);
    if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
    }
    if (message.status === 'sent') {
        message.status = 'delivered';
        await message.save();
    }
    const chat = await Conversation_1.default.findByPk(Number(req.params.id));
    if (io && chat) {
        (chat.participantIds || []).forEach((uid) => {
            io.to(`user_${uid}`).emit('messageDelivered', { messageId: message.id, chatId: message.conversationId });
        });
    }
    res.json({ success: true, data: message.toJSON() });
    return;
}));
// PATCH /:id/messages/:messageId/read - сообщение прочитано
router.patch('/:id/messages/:messageId/read', (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const messageId = Number(req.params.messageId);
    const message = await Message_1.default.findByPk(messageId);
    if (!message) {
        res.status(404).json({ success: false, message: 'Message not found' });
        return;
    }
    if (message.status !== 'read') {
        message.status = 'read';
        message.readAt = new Date();
        await message.save();
    }
    const chat = await Conversation_1.default.findByPk(Number(req.params.id));
    if (io && chat) {
        (chat.participantIds || []).forEach((uid) => {
            io.to(`user_${uid}`).emit('messageRead', { messageId: message.id, chatId: message.conversationId });
        });
    }
    res.json({ success: true, data: message.toJSON() });
    return;
}));
exports.default = router;
//# sourceMappingURL=conversations.js.map