import { Router, Request, Response } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { upload } from '../middleware/upload';
import fs from 'fs';
import path from 'path';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const authMiddleware = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Нет токена' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as any).userId = decoded.userId;
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: 'Невалидный токен' });
  }
};

router.use(authMiddleware);

router.get('/', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'email', 'status', 'avatarUrl', 'lastSeenAt', 'createdAt']
  });
  if (!user) return res.status(404).json({ success: false, message: 'Не найден' });
  res.json({ success: true, data: user });
}));

router.put('/', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const { username, status } = req.body;
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ success: false, message: 'Не найден' });
  if (username) user.username = username;
  if (status) user.status = status;
  await user.save();
  res.json({ success: true, data: user });
}));

router.post('/avatar', upload.single('avatar'), asyncHandler(async (req: any, res) => {
  const userId = req.userId;
  if (!req.file) return res.status(400).json({ success: false, message: 'Файл не загружен' });
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ success: false, message: 'Не найден' });
  if (user.avatarUrl) {
    const oldPath = path.join(__dirname, '../../', user.avatarUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  const avatarUrl = `uploads/${req.file.filename}`;
  user.avatarUrl = avatarUrl;
  await user.save();
  res.json({ success: true, data: { avatarUrl } });
}));

router.delete('/avatar', asyncHandler(async (req, res) => {
  const userId = (req as any).userId;
  const user = await User.findByPk(userId);
  if (!user) return res.status(404).json({ success: false, message: 'Не найден' });
  if (user.avatarUrl) {
    const oldPath = path.join(__dirname, '../../', user.avatarUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  user.avatarUrl = null;
  await user.save();
  res.json({ success: true, message: 'Аватар удалён' });
}));

export default router;
