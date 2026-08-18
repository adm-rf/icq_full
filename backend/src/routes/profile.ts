import { Router, Request, Response, NextFunction } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { upload } from '../middleware/upload';
import fs from 'fs';
import path from 'path';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production') as any;
    (req as any).userId = decoded.userId || decoded.id || decoded.sub;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Невалидный токен' });
  }
};

router.use(authMiddleware);

// GET /api/profile - данные текущего пользователя
router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const user = await User.findByPk(userId, {
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
router.put('/', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const { username, status } = req.body || {};

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'Пользователь не найден' });
    return;
  }

  if (username) user.username = username;
  if (status) user.status = status;
  await user.save();

  res.json({ success: true, data: user.toJSON() });
  return;
}));

// POST /api/profile/avatar - загрузить аватар
router.post('/avatar', upload.single('avatar'), asyncHandler(async (req: any, res: any) => {
  const userId = req.userId;

  if (!req.file) {
    res.status(400).json({ success: false, message: 'Файл не загружен' });
    return;
  }

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'Пользователь не найден' });
    return;
  }

  if (user.avatarUrl) {
    const oldPath = path.join(__dirname, '../../', user.avatarUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  const avatarUrl = `uploads/${req.file.filename}`;
  user.avatarUrl = avatarUrl;
  await user.save();

  res.json({ success: true, data: { avatarUrl } });
  return;
}));

// DELETE /api/profile/avatar - удалить аватар
router.delete('/avatar', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;

  const user = await User.findByPk(userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'Пользователь не найден' });
    return;
  }

  if (user.avatarUrl) {
    const oldPath = path.join(__dirname, '../../', user.avatarUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  user.avatarUrl = null;
  await user.save();

  res.json({ success: true, message: 'Аватар удалён' });
  return;
}));

export default router;
