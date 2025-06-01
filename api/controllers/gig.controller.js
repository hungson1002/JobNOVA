import { Op } from 'sequelize';
import { models } from '../models/Sequelize-mysql.js';

// Tạo gig
// Tạo gig
export const createGig = async (req, res, next) => {
  try {
    const seller_clerk_id = req.user.clerk_id;

    const {
      category_id,
      job_type_id,
      title,
      description,
      starting_price,
      delivery_time,
      gig_image,
      gig_images,
      city,
      country,
      faqs,
      gig_requirement_templates,
    } = req.body;

    if (!seller_clerk_id || !title) {
      return res.status(400).json({ success: false, message: "Missing required fields: seller_clerk_id or title" });
    }

    const gig = await models.Gig.create({
      seller_clerk_id,
      category_id,
      job_type_id,
      title,
      description,
      starting_price,
      delivery_time,
      gig_image,
      gig_images: gig_images ? JSON.stringify(gig_images) : null,
      city,
      country,
      status: "pending",
    });
    if (faqs && Array.isArray(faqs)) {
      await Promise.all(faqs.map(faq =>
        models.GigFaq.create({
          gig_id: gig.id,
          question: faq.question,
          answer: faq.answer,
        })
      ));
    }

    if (gig_requirement_templates && Array.isArray(gig_requirement_templates)) {
      await Promise.all(gig_requirement_templates.map(req =>
        models.GigRequirementTemplate.create({
          gig_id: gig.id,
          requirement_text: req.requirement_text,
          is_required: req.is_required,
        })
      ));
    }

    const gigData = gig.toJSON();

    if (gigData.gig_images) {
      try {
        gigData.gig_images = JSON.parse(gigData.gig_images);
      } catch {
        gigData.gig_images = [];
      }
    }

    const createdFaqs = await models.GigFaq.findAll({ where: { gig_id: gig.id } });
    gigData.faqs = createdFaqs.map(f => ({ question: f.question, answer: f.answer }));

    const createdRequirements = await models.GigRequirementTemplate.findAll({ where: { gig_id: gig.id } });
    gigData.requirements = createdRequirements.map(r => ({
      requirement_text: r.requirement_text,
      is_required: r.is_required,
    }));

    return res.status(201).json({ success: true, message: "Gig created successfully", gig: gigData });
  } catch (error) {
    console.error("Error creating gig:", error.message);
    return res.status(500).json({ success: false, message: "Error creating gig", error: error.message });
  }
};

// Lấy tất cả gig 
export const getAllGigs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category_id, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    if (category_id) where.category_id = category_id;

    if (req.query.seller_clerk_id) {
      where.seller_clerk_id = req.query.seller_clerk_id;
    } else {
      where.status = status || "active";
    }

    const gigs = await models.Gig.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: models.User,
          as: 'seller',
          attributes: ['firstname', 'lastname', 'username', 'clerk_id', 'avatar'],
        },
        {
          model: models.Category,
          as: 'category',
          attributes: ['id', 'name'],
        },
        {
          model: models.JobType,
          as: 'job_type',
          attributes: ['id', 'job_type'],
        },
      ],
    });

    const gigsRows = await Promise.all(gigs.rows.map(async (gig) => {
      const gigData = gig.toJSON();

      if (gigData.gig_images) {
        try {
          gigData.gig_images = JSON.parse(gigData.gig_images);
        } catch {
          gigData.gig_images = [];
        }
      }

      if (gigData.seller) {
        gigData.seller = {
          name:
            gigData.seller.firstname && gigData.seller.lastname
              ? gigData.seller.firstname + ' ' + gigData.seller.lastname
              : gigData.seller.firstname || gigData.seller.username || 'Người dùng',
          avatar: gigData.seller.avatar || '/placeholder.svg',
          level: 'Seller',
        };
      } else {
        gigData.seller = {
          name: 'Người dùng',
          avatar: '/placeholder.svg',
          level: 'Seller',
        };
      }

      const createdAt = new Date(gigData.created_at);
      const isNew = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;
      gigData.badges = [];
      if (isNew) gigData.badges.push("new");
      if (gigData.isToprate) gigData.badges.push("top_rated");

      const reviews = await models.Review.findAll({
        where: { gig_id: gig.id },
        attributes: ['rating'],
      });

      const totalStars = reviews.reduce((sum, r) => sum + r.rating, 0);
      gigData.rating = reviews.length ? totalStars / reviews.length : 0;
      gigData.review_count = reviews.length;

      return gigData;
    }));

    return res.status(200).json({
      success: true,
      total: gigs.count,
      pages: Math.ceil(gigs.count / limit),
      gigs: gigsRows,
    });
  } catch (error) {
    console.error('Error fetching gigs:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error fetching gigs',
      error: error.message,
    });
  }
};

// Lấy gig theo ID
export const getGigById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const gig = await models.Gig.findByPk(id, {
      include: [
        {
          model: models.User,
          as: 'seller',
          attributes: ['firstname', 'lastname', 'username', 'clerk_id', 'avatar'],
        },
      ],
    });
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }
    const gigData = gig.toJSON();
    if (gigData.gig_images) {
      try { gigData.gig_images = JSON.parse(gigData.gig_images); } catch { gigData.gig_images = []; }
    }
    const faqs = await models.GigFaq.findAll({ where: { gig_id: id } });
    gigData.faqs = faqs.map(f => ({ question: f.question, answer: f.answer }));
    if (gigData.requirements) {
      try { gigData.requirements = JSON.parse(gigData.requirements); } catch { gigData.requirements = []; }
    } else {
      gigData.requirements = [];
    }
    gigData.order_count = await models.Order.count({ where: { gig_id: gigData.id } });
    return res.status(200).json({ success: true, gig: gigData });
  } catch (error) {
    console.error('Error fetching gig:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching gig', error: error.message });
  }
};

// Cập nhật gig
export const updateGig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      category_id, job_type_id, title, description, starting_price, delivery_time,
      gig_image, city, country, status,
      isToprate, is_top_rate, isTopRate
    } = req.body;
    const gig = await models.Gig.findByPk(id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }
    const topRateValue = isToprate ?? is_top_rate ?? isTopRate;
    await gig.update({
      category_id,
      job_type_id,
      title,
      description,
      starting_price,
      delivery_time,
      gig_image,
      city,
      country,
      status,
      ...(topRateValue !== undefined ? { isToprate: topRateValue } : {})
    });
    console.log(`Gig updated: id=${id}, isToprate=${topRateValue}`);
    return res.status(200).json({ success: true, message: 'Gig updated successfully', gig });
  } catch (error) {
    console.error('Error updating gig:', error.message);
    return res.status(500).json({ success: false, message: 'Error updating gig', error: error.message });
  }
};

// Xóa gig
export const deleteGig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const gig = await models.Gig.findByPk(id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }

    // Kiểm tra xem có orders nào chưa completed không
    const pendingOrders = await models.Order.findAll({
      where: {
        gig_id: id,
        order_status: {
          [Op.notIn]: ['completed', 'cancelled']
        }
      }
    });

    if (pendingOrders.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Cannot delete gig because it has pending orders. Please complete or cancel all orders first.' 
      });
    }

    // Xóa các bản ghi liên quan trước
    await Promise.all([
      models.Review.destroy({ where: { gig_id: id } }),
      models.SavedGig.destroy({ where: { gig_id: id } }),
      models.GigFaq.destroy({ where: { gig_id: id } }),
      models.GigExtra.destroy({ where: { gig_id: id } }),
      models.GigSkill.destroy({ where: { gig_id: id } }),
      models.GigTranslation.destroy({ where: { gig_id: id } }),
      models.GigView.destroy({ where: { gig_id: id } }),
      models.GigViewCount.destroy({ where: { gig_id: id } }),
      models.Notification.destroy({ where: { gig_id: id } }),
      models.AdminLog.destroy({ where: { gig_id: id } })
    ]);

    // Lưu lại seller_clerk_id và title trước khi xóa gig
    const sellerClerkId = gig.seller_clerk_id;
    const gigTitle = gig.title;
    const reason = req.body?.reason || "";

    // Sau đó xóa gig
    await gig.destroy();
    console.log(`Gig deleted: id=${id}`);

    // Chỉ gửi notification nếu người xóa là admin
    const roles = req.user?.user_roles || [];
    if (roles.includes("admin") && sellerClerkId && req.io) {
      try {
        const notification = await models.Notification.create({
          clerk_id: sellerClerkId,
          title: "Gig deleted",
          message: `Your gig \"${gigTitle}\" was deleted by admin.${reason ? ` Reason: ${reason}` : ""}`,
          is_read: false,
          gig_id: null, // gig đã bị xóa nên để null
          notification_type: "system",
        });
        req.io.to(sellerClerkId).emit("new_notification", notification);
      } catch (err) {
        console.error("Error creating notification after gig delete:", err.message);
      }
    }

    return res.status(200).json({ success: true, message: 'Gig deleted successfully' });
  } catch (error) {
    console.error('Error deleting gig:', error.message);
    return res.status(500).json({ success: false, message: 'Error deleting gig', error: error.message });
  }
};

// Tìm kiếm gig
export const searchGigs = async (req, res, next) => {
  try {
    const { keyword } = req.query;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Missing required field: keyword' });
    }
    const gigs = await models.Gig.findAll({
      where: {
        title: {
          [Op.like]: `%${keyword}%`,
        },
      },
    });
    return res.status(200).json({ success: true, gigs });
  } catch (error) {
    console.error('Error searching gigs:', error.message);
    return res.status(500).json({ success: false, message: 'Error searching gigs', error: error.message });
  }
};

// export const getGigsBySeller = async (req, res) => {
//   try {
//     const { clerk_id } = req.params;
//     const gigs = await models.Gig.findAll({ where: { clerk_id } });
//     res.json(Array.isArray(gigs) ? gigs : []);
//   } catch (error) {
//     res.status(500).json({ message: "Error fetching gigs by seller", error: error.message });
//   }
// };