import { models } from '../models/Sequelize-mysql.js';

// Tạo lịch sử tìm kiếm
export const createUserSearchHistory = async (req, res, next) => {
  try {
    const { clerk_id, search_keyword, category_id, job_type_id, city, country, search_date } = req.body;
    if (!clerk_id || !search_keyword) {
      return res.status(400).json({ success: false, message: 'Missing required fields: clerk_id or search_keyword' });
    }
    const history = await models.UserSearchHistory.create({
      clerk_id,
      search_keyword,
      category_id,
      job_type_id,
      city,
      country,
      search_date,
    });
    console.log(`Search history created: id=${history.id}`);
    return res.status(201).json({ success: true, message: 'Search history created successfully', history });
  } catch (error) {
    console.error('Error creating search history:', error.message);
    return res.status(500).json({ success: false, message: 'Error creating search history', error: error.message });
  }
};

// Lấy tất cả lịch sử tìm kiếm (phân trang)
export const getAllUserSearchHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, clerk_id } = req.query;
    if (!clerk_id) {
      return res.status(400).json({ success: false, message: 'Missing required query: clerk_id' });
    }
    const offset = (page - 1) * limit;
    const history = await models.UserSearchHistory.findAndCountAll({
      where: { clerk_id },
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    return res.status(200).json({
      success: true,
      total: history.count,
      pages: Math.ceil(history.count / limit),
      history: history.rows,
    });
  } catch (error) {
    console.error('Error fetching search history:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching search history', error: error.message });
  }
};

// Lấy lịch sử tìm kiếm theo ID
export const getUserSearchHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await models.UserSearchHistory.findByPk(id);
    if (!history) {
      return res.status(404).json({ success: false, message: 'Search history not found' });
    }
    return res.status(200).json({ success: true, history });
  } catch (error) {
    console.error('Error fetching search history:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching search history', error: error.message });
  }
};

// Xóa lịch sử tìm kiếm
export const deleteUserSearchHistory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const history = await models.UserSearchHistory.findByPk(id);
    if (!history) {
      return res.status(404).json({ success: false, message: 'Search history not found' });
    }
    await history.destroy();
    console.log(`Search history deleted: id=${id}`);
    return res.status(200).json({ success: true, message: 'Search history deleted successfully' });
  } catch (error) {
    console.error('Error deleting search history:', error.message);
    return res.status(500).json({ success: false, message: 'Error deleting search history', error: error.message });
  }
};

// Xóa tất cả lịch sử tìm kiếm của user
export const deleteAllUserSearchHistory = async (req, res, next) => {
  try {
    const { clerk_id } = req.query;
    if (!clerk_id) {
      return res.status(400).json({ success: false, message: 'Missing required query: clerk_id' });
    }
    const deleted = await models.UserSearchHistory.destroy({ where: { clerk_id } });
    return res.status(200).json({ success: true, message: 'All search history deleted', deleted });
  } catch (error) {
    console.error('Error deleting all search history:', error.message);
    return res.status(500).json({ success: false, message: 'Error deleting all search history', error: error.message });
  }
};