import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import { authenticateAndLoadUser } from '../middleware/getAuth.js';
import {
    createPortfolio,
    getPortfoliosByClerkId,
    updatePortfolio,
    deletePortfolio,
    getPortfoliosByGigId,
} from '../controllers/portfolio.controller.js';

const router = express.Router();

// Create a portfolio (seller-only)
router.post('/', requireAuth, authenticateAndLoadUser, createPortfolio);

// Get portfolios by clerk_id (public or authenticated)
router.get('/:clerk_id', getPortfoliosByClerkId);

// Update a portfolio (seller-only)
router.put('/:id', requireAuth, updatePortfolio);

// Delete a portfolio (seller-only)
router.delete('/:id', requireAuth, deletePortfolio);

// Get portfolios by gig_id
router.get('/', getPortfoliosByGigId);

export default router;