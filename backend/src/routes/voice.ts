import { Router, Request, Response } from 'express';
import { voiceUpload } from '../middleware/voiceUpload';
import { asyncHandler } from '../utils/errorHandler';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * POST /api/voice — загрузить голосовое сообщение
 * Возвращает URL файла и длительность (duration приходит от клиента)
 */
router.post(
  '/',
  authenticate,
  voiceUpload.single('voice'),
  asyncHandler(async (req: Request, res: Response) => {
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
  })
);

export default router;
