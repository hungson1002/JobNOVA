import express from 'express';
import {
  createNotification,
  deleteNotification,
  getAllNotifications,
  getNotificationById,
  updateNotification,
  markAllAsRead,
} from '../controllers/notification.controller.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// Lấy danh sách notification
router.get('/', getAllNotifications);
// Lấy notification theo id
router.get('/:id', getNotificationById);
// Tạo notification mới
router.post('/', requireAuth, createNotification);
// Cập nhật notification
router.patch('/:id', requireAuth, updateNotification);
// Xóa notification
router.delete('/:id', requireAuth, deleteNotification);
// Đánh dấu tất cả thông báo là đã đọc
router.post('/mark-all-as-read', requireAuth, markAllAsRead);

export default router;