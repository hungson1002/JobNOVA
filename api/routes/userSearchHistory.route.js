import express from 'express';
import {
    createUserSearchHistory,
    deleteUserSearchHistory,
    getAllUserSearchHistory,
    getUserSearchHistoryById,
    deleteAllUserSearchHistory
} from '../controllers/userSearchHistory.controller.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// Lấy danh sách user search history
router.get('/', requireAuth, getAllUserSearchHistory);
// Lấy user search history theo id
router.get('/:id', requireAuth, getUserSearchHistoryById);
// Tạo user search history mới
router.post('/', requireAuth, createUserSearchHistory);
// Xóa tất cả lịch sử tìm kiếm của user
router.delete('/all', requireAuth, deleteAllUserSearchHistory);
// Xóa user search history
router.delete('/:id', requireAuth, deleteUserSearchHistory);

export default router;