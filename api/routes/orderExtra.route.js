import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
    createOrderExtra,
    getOrderExtrasByOrderId,
    deleteOrderExtra
} from '../controllers/orderExtra.controller.js';

const router = express.Router();

// Create an order extra (buyer-only)
router.post('/', requireAuth, createOrderExtra);

// Get order extras by order_id (authenticated, admin, buyer, or seller)
router.get('/:order_id', requireAuth, getOrderExtrasByOrderId);

// Delete an order extra (buyer-only)
router.delete('/:id', requireAuth, deleteOrderExtra);

export default router;