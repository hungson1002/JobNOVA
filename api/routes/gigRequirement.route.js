import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
    createGigRequirement,
    getGigRequirementsByOrderId
} from '../controllers/gigRequirement.controller.js';

const router = express.Router();

// Create a gig requirement (buyer-only)
router.post('/', requireAuth, createGigRequirement);

// Get gig requirements by order_id (authenticated, admin, buyer, or seller)
router.get('/:order_id', requireAuth, getGigRequirementsByOrderId);

export default router;