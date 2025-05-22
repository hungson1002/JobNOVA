import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
    createGigFaq,
    getGigFaqsByGigId,
    updateGigFaq,
    deleteGigFaq
} from '../controllers/gigFAQ.controller.js';

const router = express.Router();

// Create a FAQ (seller-only)
router.post('/', requireAuth, createGigFaq);

// Get FAQs by gig_id (public)
router.get('/:gig_id', getGigFaqsByGigId);

// Update a FAQ (seller-only)
router.put('/:id', requireAuth, updateGigFaq);

// Delete a FAQ (seller-only)
router.delete('/:id', requireAuth, deleteGigFaq);

export default router;