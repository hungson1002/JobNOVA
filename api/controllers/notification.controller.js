import { models } from '../models/Sequelize-mysql.js';

// Tạo thông báo
export const createNotification = async (req, res, next) => {
  try {
    const { clerk_id, title, message, is_read, gig_id, notification_type } = req.body;
    if (!clerk_id || !title || !message) {
      return res.status(400).json({ success: false, message: 'Missing required fields: clerk_id, title, or message' });
    }

    const notification = await models.Notification.create({
      clerk_id,
      title,
      message,
      is_read,
      gig_id,
      notification_type,
    });

    console.log(`Notification created: id=${notification.id}`);

    req.io.to(clerk_id).emit("new_notification", notification);

    return res.status(201).json({ success: true, message: 'Notification created successfully', notification });
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return res.status(500).json({ success: false, message: 'Error creating notification', error: error.message });
  }
};


// Lấy tất cả thông báo (phân trang)
export const getAllNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, clerk_id, is_read } = req.query;
    if (!clerk_id) {
      return res.status(400).json({ success: false, message: 'Missing required query: clerk_id' });
    }
    const offset = (page - 1) * limit;
    const where = { clerk_id };
    if (is_read !== undefined) where.is_read = is_read;

    const notifications = await models.Notification.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    return res.status(200).json({
      success: true,
      total: notifications.count,
      pages: Math.ceil(notifications.count / limit),
      notifications: notifications.rows,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching notifications', error: error.message });
  }
};

// Lấy thông báo theo ID
export const getNotificationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await models.Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    return res.status(200).json({ success: true, notification });
  } catch (error) {
    console.error('Error fetching notification:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching notification', error: error.message });
  }
};

// Cập nhật thông báo
export const updateNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_read } = req.body;
    const notification = await models.Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    await notification.update({ is_read });
    console.log(`Notification updated: id=${id}`);
    return res.status(200).json({ success: true, message: 'Notification updated successfully', notification });
  } catch (error) {
    console.error('Error updating notification:', error.message);
    return res.status(500).json({ success: false, message: 'Error updating notification', error: error.message });
  }
};

// Xóa thông báo
export const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await models.Notification.findByPk(id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    await notification.destroy();
    console.log(`Notification deleted: id=${id}`);
    return res.status(200).json({ success: true, message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error.message);
    return res.status(500).json({ success: false, message: 'Error deleting notification', error: error.message });
  }
};

// Đánh dấu tất cả thông báo là đã đọc
export const markAllAsRead = async (req, res) => {
  try {
    const { clerk_id } = req.body;
    if (!clerk_id) {
      return res.status(400).json({ success: false, message: "Missing clerk_id" });
    }

    await models.Notification.update(
      { is_read: true },
      { where: { clerk_id, is_read: false } }
    );

    return res.status(200).json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all as read:", error.message);
    return res.status(500).json({ success: false, message: "Error updating notifications", error: error.message });
  }
};
