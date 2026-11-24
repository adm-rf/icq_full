"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const voiceUpload_1 = require("../middleware/voiceUpload");
const errorHandler_1 = require("../utils/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * POST /api/voice — загрузить голосовое сообщение
 * Возвращает URL файла и длительность (duration приходит от клиента)
 */
router.post('/', auth_1.authenticate, voiceUpload_1.voiceUpload.single('voice'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.file) {
        res.status(400).json({ success: false, message: 'Файл не загружен' });
        return;
    }
    const fileUrl = `uploads/voice/${req.file.filename}`;
    const duration = Number(req.body.duration) || 0;
    console.log('🎤 Голосовое загружено:', fileUrl, 'длительность:', duration);
    res.json({
        success: true,
        data: {
            fileUrl,
            duration,
            size: req.file.size,
        },
    });
}));
exports.default = router;
//# sourceMappingURL=voice.js.map