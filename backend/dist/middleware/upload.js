"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const uploadsDir = path_1.default.join(__dirname, '../../uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    fs_1.default.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const userId = req.userId || 'unknown';
        const ext = path_1.default.extname(file.originalname);
        cb(null, `${userId}-${Date.now()}${ext}`);
    }
});
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/'))
        cb(null, true);
    else
        cb(new Error('Только изображения!'), false);
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }
});
//# sourceMappingURL=upload.js.map