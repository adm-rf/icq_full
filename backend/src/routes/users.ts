import { Router } from 'express';
import { asyncHandler } from '../utils/errorHandler';
import User from '../models/User';

const router = Router();

// GET /api/users - получить список всех пользователей
router.get('/', asyncHandler(async (req, res) => {
  try {
    const users = await User.findAll({
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
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
  return;
}));

// GET /api/users/:id - получить пользователя по ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  try {
    const user = await User.findByPk(id, {
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
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
  return;
}));

export default router;
