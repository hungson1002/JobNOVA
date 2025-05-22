import { models } from '../models/Sequelize-mysql.js';
import { Op } from 'sequelize';

// Tạo gig
export const createGig = async (req, res, next) => {
  try {
    const { seller_clerk_id, category_id, job_type_id, title, description, starting_price, delivery_time, gig_image, city, country } = req.body;
    if (!seller_clerk_id || !title) {
      return res.status(400).json({ success: false, message: 'Missing required fields: seller_clerk_id or title' });
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
      city,
      country,
      status: "pending",
    });
    console.log(`Gig created: id=${gig.id}`);
    return res.status(201).json({ success: true, message: 'Gig created successfully', gig });
  } catch (error) {
    console.error('Error creating gig:', error.message);
    return res.status(500).json({ success: false, message: 'Error creating gig', error: error.message });
  }
};

// Lấy tất cả gig (phân trang và lọc)
export const getAllGigs = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category_id, status } = req.query;
    const offset = (page - 1) * limit;
    const where = {};
    if (category_id) where.category_id = category_id;
    if (status) {
      where.status = status;
    } else {
      where.status = "active";
    }

    const gigs = await models.Gig.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    return res.status(200).json({
      success: true,
      total: gigs.count,
      pages: Math.ceil(gigs.count / limit),
      gigs: gigs.rows,
    });
  } catch (error) {
    console.error('Error fetching gigs:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching gigs', error: error.message });
  }
};

// Lấy gig theo ID
export const getGigById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const gig = await models.Gig.findByPk(id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }
    return res.status(200).json({ success: true, gig });
  } catch (error) {
    console.error('Error fetching gig:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching gig', error: error.message });
  }
};

// Cập nhật gig
export const updateGig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category_id, job_type_id, title, description, starting_price, delivery_time, gig_image, city, country, status } = req.body;
    const gig = await models.Gig.findByPk(id);
    if (!gig) {
      return res.status(404).json({ success: false, message: 'Gig not found' });
    }
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
    });
    console.log(`Gig updated: id=${id}`);
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
    await gig.destroy();
    console.log(`Gig deleted: id=${id}`);
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