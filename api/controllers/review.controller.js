import { Op } from 'sequelize';
import { models, sequelize } from '../models/Sequelize-mysql.js';

// Tạo đánh giá
export const createReview = async (req, res, next) => {
  try {
    const { order_id, gig_id, rating, comment, sellerCommunication, qualityOfDelivery, valueOfDelivery } = req.body;
    const reviewer_clerk_id = req.user.clerk_id;

    if (!order_id || !gig_id || !rating || !sellerCommunication || !qualityOfDelivery || !valueOfDelivery) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const order = await models.Order.findByPk(order_id);
    if (!order || order.buyer_clerk_id !== reviewer_clerk_id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to review this order",
      });
    }

    const existing = await models.Review.findOne({
      where: { order_id, reviewer_clerk_id },
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this order",
      });
    }

    const review = await models.Review.create({
      order_id,
      gig_id,
      reviewer_clerk_id,
      rating,
      comment,
      sellerCommunication,
      qualityOfDelivery,
      valueOfDelivery,
      helpfulYes: 0,
      helpfulNo: 0,
    });

    const gig = await models.Gig.findByPk(gig_id);
    if (gig && req.io) {
      // 1. Lưu notification vào DB
      const notification = await models.Notification.create({
        clerk_id: gig.seller_clerk_id,
        title: "Bạn có đánh giá mới",
        message: `Gig của bạn vừa nhận được đánh giá ${rating} sao.`,
        is_read: false,
        gig_id,
        notification_type: "review",
      });
      // 2. Gửi socket
      req.io.to(gig.seller_clerk_id).emit("new_notification", notification);
    }

    const reviewer = await models.User.findOne({
      where: { clerk_id: reviewer_clerk_id },
      attributes: ['clerk_id', 'username', 'avatar', 'country', 'firstname', 'lastname'],
    });

    const fullName = [reviewer?.firstname, reviewer?.lastname].filter(Boolean).join(' ').trim();

    return res.status(201).json({
      success: true,
      message: 'Review created successfully',
      review: {
        ...review.get({ plain: true }),
        user: {
          name: fullName || reviewer?.username || reviewer_clerk_id,
          avatar: reviewer?.avatar || '/placeholder.svg',
          country: reviewer?.country || 'Unknown',
        },
        helpful: { yes: 0, no: 0 },
        sellerResponse: null,
      },
    });
  } catch (error) {
    console.error('Error creating review:', error.message);
    return res.status(500).json({ success: false, message: 'Error creating review', error: error.message });
  }
};


// Lấy tất cả review (phân trang + filter + sort)
export const getAllReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, gig_id, order_id, search, sort } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (gig_id && gig_id !== "undefined" && gig_id !== "") {
      where.gig_id = Number(gig_id);
    }
    if (typeof order_id !== "undefined" && order_id !== "undefined" && order_id !== "") {
      where.order_id = order_id;
    }
    if (search && search !== "undefined") {
      where.comment = { [Op.like]: `%${search}%` };
    }

    const reviews = await models.Review.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: models.User,
          as: 'reviewer',
          attributes: ['clerk_id', 'country', 'username', 'firstname', 'lastname', 'avatar'],
        },
        {
          model: models.Order,
          as: "order",
          attributes: ["id", "total_price", "delivery_deadline"],
        },
        {
          model: models.Gig,
          as: "gig",
          attributes: ["id", "seller_clerk_id"],
          include: [
            {
              model: models.User,
              as: "seller",
              attributes: ["clerk_id", "firstname", "lastname", "avatar", "username"],
            },
          ],
        },
      ],
    });

    const ratingSummary = await models.Review.findAll({
      where: { gig_id },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'average'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total'],
        [sequelize.literal(`SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)`), '5'],
        [sequelize.literal(`SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)`), '4'],
        [sequelize.literal(`SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)`), '3'],
        [sequelize.literal(`SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)`), '2'],
        [sequelize.literal(`SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)`), '1'],
      ],
      raw: true,
    });

    const ratingBreakdown = await models.Review.findAll({
      where: { gig_id },
      attributes: [
        [sequelize.fn("AVG", sequelize.col("sellerCommunication")), "sellerCommunication"],
        [sequelize.fn("AVG", sequelize.col("qualityOfDelivery")), "qualityOfDelivery"],
        [sequelize.fn("AVG", sequelize.col("valueOfDelivery")), "valueOfDelivery"],
      ],
      raw: true,
    });

    const enrichedReviews = reviews.rows.map((review) => {
      const plain = review.get({ plain: true });
      const fullName = [plain.reviewer?.firstname, plain.reviewer?.lastname].filter(Boolean).join(' ').trim();

      return {
        ...plain,
        user: {
          name: fullName || plain.reviewer?.username || plain.reviewer_clerk_id || 'User',
          avatar: plain.reviewer?.avatar || '/placeholder.svg',
          country: plain.reviewer?.country || 'Unknown',
        },
        price: plain.order?.total_price || 50,
        duration: plain.order?.delivery_deadline && plain.created_at
          ? Math.ceil((new Date(plain.order.delivery_deadline) - new Date(plain.created_at)) / (1000 * 60 * 60 * 24))
          : 13,
        sellerResponse: plain.sellerResponse || null,
        helpful: {
          yes: plain.helpfulYes || 0,
          no: plain.helpfulNo || 0,
        },
        seller: {
          name: [plain.gig?.seller?.firstname, plain.gig?.seller?.lastname].filter(Boolean).join(' ').trim() || 'Seller',
          avatar: plain.gig?.seller?.avatar || '/placeholder.svg',
        },
        seller_clerk_id: plain.gig?.seller_clerk_id || null,
      };
    });

    if (sort === 'relevant') {
      enrichedReviews.sort((a, b) => {
        const scoreA = a.rating * 1000 + (new Date(a.created_at).getTime() / 1000000);
        const scoreB = b.rating * 1000 + (new Date(b.created_at).getTime() / 1000000);
        return scoreB - scoreA;
      });
    }

    return res.status(200).json({
      success: true,
      total: reviews.count,
      pages: Math.ceil(reviews.count / limit),
      reviews: enrichedReviews,
      ratingSummary: {
        average: parseFloat(ratingSummary[0]?.average || 0).toFixed(1),
        total: ratingSummary[0]?.total || 0,
        breakdown: {
          5: ratingSummary[0]?.['5'] || 0,
          4: ratingSummary[0]?.['4'] || 0,
          3: ratingSummary[0]?.['3'] || 0,
          2: ratingSummary[0]?.['2'] || 0,
          1: ratingSummary[0]?.['1'] || 0,
        },
      },
      ratingBreakdown: {
        sellerCommunication: parseFloat(ratingBreakdown[0]?.sellerCommunication || 0).toFixed(1),
        qualityOfDelivery: parseFloat(ratingBreakdown[0]?.qualityOfDelivery || 0).toFixed(1),
        valueOfDelivery: parseFloat(ratingBreakdown[0]?.valueOfDelivery || 0).toFixed(1),
      },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching reviews', error: error.message });
  }
};

// Lấy theo ID
export const getReviewById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await models.Review.findByPk(id, {
      include: [
        {
          model: models.User,
          as: "reviewer",
          attributes: ["clerk_id", "country", "firstname", "lastname", "avatar", "username"],
        },
        {
          model: models.Order,
          as: "order",
          attributes: ["id", "total_price", "delivery_deadline"],
        },
        {
          model: models.Gig,
          as: "gig",
          attributes: ["id", "seller_clerk_id"],
          include: [
            {
              model: models.User,
              as: "seller",
              attributes: ["clerk_id", "firstname", "lastname", "avatar", "username"],
            },
          ],
        },
      ],
    });

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const enrichedReview = {
      ...review.get({ plain: true }),
      user: {
        name: [review.reviewer?.firstname, review.reviewer?.lastname].filter(Boolean).join(" ").trim() || review.reviewer?.username || "User",
        avatar: review.reviewer?.avatar || "/placeholder.svg",
        country: review.reviewer?.country || "Unknown",
      },
      price: review.order?.total_price || 50,
      duration: review.order?.delivery_deadline
        ? Math.ceil((new Date(review.order.delivery_deadline) - new Date(review.created_at)) / (1000 * 60 * 60 * 24))
        : 13,
      sellerResponse: review.sellerResponse || null,
      helpful: {
        yes: review.helpfulYes || 0,
        no: review.helpfulNo || 0,
      },
      seller: {
        name: [review.gig?.seller?.firstname, review.gig?.seller?.lastname].filter(Boolean).join(" ").trim() || "Seller",
        avatar: review.gig?.seller?.avatar || "/placeholder.svg",
      },
      seller_clerk_id: review.gig?.seller_clerk_id || null,
    };

    return res.status(200).json({ success: true, review: enrichedReview });
  } catch (error) {
    console.error("Error fetching review:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching review", error: error.message });
  }
};

// Cập nhật đánh giá
export const updateReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment, sellerCommunication, qualityOfDelivery, valueOfDelivery } = req.body;
    const review = await models.Review.findByPk(id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (review.reviewer_clerk_id !== req.user.clerk_id) {
      return res.status(403).json({ success: false, message: "You can only update your own review" });
    }

    await review.update({ rating, comment, sellerCommunication, qualityOfDelivery, valueOfDelivery });

    return res.status(200).json({ success: true, message: "Review updated successfully", review });
  } catch (error) {
    console.error("Error updating review:", error.message);
    return res.status(500).json({ success: false, message: "Error updating review", error: error.message });
  }
};

// Xóa đánh giá
export const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await models.Review.findByPk(id);

    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    if (review.reviewer_clerk_id !== req.user.clerk_id) {
      return res.status(403).json({ success: false, message: "You can only delete your own review" });
    }

    await review.destroy();

    return res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error.message);
    return res.status(500).json({ success: false, message: 'Error deleting review', error: error.message });
  }
};


// Cập nhật sellerResponse
export const updateSellerResponse = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sellerResponse } = req.body;
    const review = await models.Review.findByPk(id, {
      include: [
        {
          model: models.Gig,
          as: "gig",
          attributes: ["seller_clerk_id"],
        },
      ],
    });
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    // Kiểm tra quyền: Chỉ seller của gig được cập nhật sellerResponse
    if (review.gig.seller_clerk_id !== req.user.clerk_id) {
      return res.status(403).json({ success: false, message: "Only the seller can update the response" });
    }
    await review.update({ sellerResponse });
    console.log(`Seller response updated: reviewId=${id}`);
    return res.status(200).json({ success: true, message: "Seller response updated successfully", review });
  } catch (error) {
    console.error("Error updating seller response:", error.message);
    return res.status(500).json({ success: false, message: "Error updating seller response", error: error.message });
  }
};

// Cập nhật helpful votes
export const updateHelpfulVote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { vote } = req.body; // "yes" hoặc "no"
    const clerk_id = req.user.clerk_id;

    if (!["yes", "no"].includes(vote)) {
      return res.status(400).json({ success: false, message: "Invalid vote value" });
    }

    const review = await models.Review.findByPk(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    const existingVote = await models.ReviewHelpfulVote.findOne({
      where: { review_id: id, clerk_id },
    });

    if (existingVote) {
      if (existingVote.vote === vote) {
        // Nếu đã vote giống → xóa vote (gỡ)
        await existingVote.destroy();
        await review.decrement(vote === "yes" ? "helpfulYes" : "helpfulNo");
        return res.status(200).json({ success: true, message: "Vote removed", action: "removed" });
    } else {
        // Nếu đã vote khác → update sang vote mới
        await review.decrement(existingVote.vote === "yes" ? "helpfulYes" : "helpfulNo");
        await review.increment(vote === "yes" ? "helpfulYes" : "helpfulNo");
        await existingVote.update({ vote });
        return res.status(200).json({ success: true, message: "Vote updated", action: "updated", vote });
      }
    }

    // Nếu chưa vote
    await models.ReviewHelpfulVote.create({ review_id: id, clerk_id, vote });
    await review.increment(vote === "yes" ? "helpfulYes" : "helpfulNo");

    return res.status(200).json({ success: true, message: "Vote added", action: "added" });
  } catch (error) {
    console.error("Error updating helpful vote:", error.message);
    return res.status(500).json({ success: false, message: "Error updating helpful vote", error: error.message });
  }
};

// Lấy helpful vote của user cho 1 review
export const getHelpfulVote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const clerk_id = req.user.clerk_id;
    const vote = await models.ReviewHelpfulVote.findOne({
      where: { review_id: id, clerk_id },
    });
    return res.status(200).json({
      success: true,
      vote: vote ? vote.vote : null,
    });
  } catch (error) {
    console.error("Error fetching helpful vote:", error.message);
    return res.status(500).json({ success: false, message: "Error fetching helpful vote", error: error.message });
  }
};

// Mã bình luận (giữ nguyên để tham khảo)
// export const createReview = async (req, res, next) => {
//   if (req.isSeller)
//     return next(createError(403, "Sellers can't create a review!"));

//   try {
//     const review = await models.Review.findOne({
//       where: {
//         gigId: req.body.gigId,
//         userId: req.userId,
//       },
//     });

//     if (review)
//       return next(
//         createError(403, "You have already created a review for this gig!")
//       );

//     const newReview = await models.Review.create({
//       userId: req.userId,
//       gigId: req.body.gigId,
//       desc: req.body.desc,
//       star: req.body.star,
//     });

//     await models.Gig.update(
//       {
//         totalStars: sequelize.literal(`totalStars + ${req.body.star}`),
//         starNumber: sequelize.literal(`starNumber + 1`),
//       },
//       {
//         where: { id: req.body.gigId },
//       }
//     );

//     res.status(201).send(newReview);
//   } catch (err) {
//     next(err);
//   }
// };

// export const getReviews = async (req, res, next) => {
//   try {
//     const reviews = await models.Review.findAll({
//       where: { gigId: req.params.gigId },
//     });
//     res.status(200).send(reviews);
//   } catch (err) {
//     next(err);
//   }
// };

// export const deleteReview = async (req, res, next) => {
//   try {
//     const review = await models.Review.findByPk(req.params.id);
//     if (!review) return next(createError(404, "Review not found!"));
//     if (review.userId !== req.userId)
//       return next(createError(403, "You can only delete your own review!"));

//     await models.Gig.update(
//       {
//         totalStars: sequelize.literal(`totalStars - ${review.star}`),
//         starNumber: sequelize.literal(`starNumber - 1`),
//       },
//       {
//         where: { id: review.gigId },
//       }
//     );

//     await review.destroy();
//     res.status(200).send("Review has been deleted!");
//   } catch (err) {
//     next(err);
//   }
// };