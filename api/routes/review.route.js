import express from 'express';
import {
  createReview,
  deleteReview,
  getAllReviews,
  getReviewById,
  updateHelpfulVote,
  updateReview,
  updateSellerResponse,
  getHelpfulVote
} from '../controllers/review.controller.js';
import { authenticateAndLoadUser } from '../middleware/getAuth.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// Lấy danh sách review
router.get('/', getAllReviews);
// Lấy review theo id
router.get('/:id', getReviewById);

router.use(requireAuth, authenticateAndLoadUser);
// Tạo review mới
router.post('/', createReview);
// Cập nhật review
router.patch('/:id', updateReview);
// Cập nhật sellerResponse (reply)
router.patch('/:id/seller-response', updateSellerResponse);
// Cập nhật helpful vote
router.post("/:id/helpful", updateHelpfulVote);
// Xóa review
router.delete('/:id', deleteReview);
// Lấy trạng thái vote helpful của user cho 1 review
router.get('/:id/helpful-vote', getHelpfulVote);

export default router;