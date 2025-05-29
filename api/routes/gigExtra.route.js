import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
    createGigExtra,
    getGigExtrasByGigId,
    updateGigExtra,
    deleteGigExtra
} from '../controllers/gigExtra.controller.js';

const router = express.Router();

// Create a gig extra (seller-only)
router.post('/', requireAuth, createGigExtra);

// Get gig extras by gig_id (public)
router.get('/:gig_id', getGigExtrasByGigId);

// Update a gig extra (seller-only)
router.put('/:id', requireAuth, updateGigExtra);

// Delete a gig extra (seller-only)
router.delete('/:id', requireAuth, deleteGigExtra);

export default router;