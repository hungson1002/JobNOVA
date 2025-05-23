// gigRequirementTemplate.route.js
import express from 'express';
import {
  createGigRequirementTemplates,
  getGigRequirementTemplates,
  updateGigRequirementTemplate,
  deleteGigRequirementTemplate,
} from '../controllers/gigReqTemplate.controller.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// Tạo nhiều requirement templates cho một gig
router.post('/', requireAuth, createGigRequirementTemplates);

// Lấy tất cả requirement templates của một gig
router.get('/:gig_id', requireAuth, getGigRequirementTemplates);

// Cập nhật một requirement template
router.put('/:id', requireAuth, updateGigRequirementTemplate);

// Xóa một requirement template
router.delete('/:id', requireAuth, deleteGigRequirementTemplate);

export default router;