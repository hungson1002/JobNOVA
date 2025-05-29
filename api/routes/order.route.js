import express from 'express';
import {
  cancelOrder,
  confirmOrder,
  createPaymentIntent,
  getOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { authenticateAndLoadUser } from '../middleware/getAuth.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

router.use(requireAuth);
router.use(authenticateAndLoadUser);

// Lấy danh sách order
router.get('/', getOrders);

// Tạo payment intent
router.post('/payment-intent', createPaymentIntent);

// Xác nhận order
router.post('/confirm', confirmOrder);

// Cập nhật trạng thái đơn hàng
router.put('/:id/status', updateOrderStatus);

// Hủy đơn hàng
router.put('/:id/cancel', cancelOrder);

export default router;