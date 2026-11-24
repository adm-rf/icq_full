"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.voiceUpload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const voiceDir = path_1.default.join(__dirname, '../../uploads/voice');
if (!fs_1.default.existsSync(voiceDir))
    fs_1.default.mkdirSync(voiceDir, { recursive: true });
const storage = multer_1.default.diskStorage({
    destination: voiceDir,
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path_1.default.extname(file.originalname);
        cb(null, uniqueName);
    }
});
const fileFilter = (req, file, cb) => {
    // Принимаем webm, ogg, mp3, wav
    if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Только аудиофайлы разрешены'));
    }
};
exports.voiceUpload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB
        files: 1,
    },
});
//# sourceMappingURL=voiceUpload.js.map