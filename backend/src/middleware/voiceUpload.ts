import multer from 'multer';
import path from 'path';
import fs from 'fs';

const voiceDir = path.join(__dirname, '../../uploads/voice');
if (!fs.existsSync(voiceDir)) fs.mkdirSync(voiceDir, { recursive: true });

const storage = multer.diskStorage({
  destination: voiceDir,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Принимаем webm, ogg, mp3, wav
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('Только аудиофайлы разрешены'));
  }
};

export const voiceUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 1,
  },
});
