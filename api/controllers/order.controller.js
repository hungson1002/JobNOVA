
import { Op } from "sequelize";
import { models } from '../models/Sequelize-mysql.js';
import createError from '../utils/createError.js';


// Tạo payment intent cho đơn hàng (bỏ qua Stripe)
export const createPaymentIntent = async (req, res, next) => {
  try {
    const { gig_id, total_price, order_date, delivery_deadline, buyer_clerk_id, seller_clerk_id } = req.body;
    const { test } = req.query; // Kiểm tra query test=true để cho phép bỏ qua auth

    // Kiểm tra dữ liệu đầu vào
    if (!gig_id || !total_price) {
      return next(createError(400, 'Missing required fields: gig_id, total_price'));
    }

    // Kiểm tra gig tồn tại
    const gig = await models.Gig.findByPk(gig_id);
    if (!gig) {
      return next(createError(404, 'Gig not found!'));
    }

    // Xác định buyer_clerk_id và seller_clerk_id
    let finalBuyerClerkId, finalSellerClerkId;

    if (test === 'true') {
      // Chế độ test: Lấy buyer_clerk_id và seller_clerk_id từ body
      if (!buyer_clerk_id || !seller_clerk_id) {
        return next(createError(400, 'buyer_clerk_id and seller_clerk_id are required in test mode'));
      }
      finalBuyerClerkId = buyer_clerk_id;
      finalSellerClerkId = seller_clerk_id;
    } else {
      // Chế độ bình thường: Yêu cầu xác thực
      if (!req.user || !req.user.clerk_id) {
        return next(createError(401, 'User authentication information is missing'));
      }
      finalBuyerClerkId = req.user.clerk_id;
      finalSellerClerkId = gig.seller_clerk_id;
    }

    // Kiểm tra quyền: buyer không được là seller của gig
    if (finalBuyerClerkId === finalSellerClerkId) {
      return next(createError(403, 'You cannot order your own gig'));
    }

    // Kiểm tra định dạng ngày
    const orderDate = order_date ? new Date(order_date) : new Date();
    if (isNaN(orderDate)) {
      return next(createError(400, 'Invalid order_date format'));
    }

    const deliveryDeadline = delivery_deadline ? new Date(delivery_deadline) : null;
    if (delivery_deadline && isNaN(deliveryDeadline)) {
      return next(createError(400, 'Invalid delivery_deadline format'));
    }

    // Tạo đơn hàng (bỏ qua Stripe, không cần payment_intent)
    const newOrder = await models.Order.create({
      gig_id,
      buyer_clerk_id: finalBuyerClerkId,
      seller_clerk_id: finalSellerClerkId,
      total_price,
      order_status: 'pending',
      order_date: orderDate,
      delivery_deadline: deliveryDeadline,
    });

    console.log(`Order created: orderId=${newOrder.id}`);
    return res.status(200).json({
      success: true,
      orderId: newOrder.id,
    });

    // Sau khi tạo order, gửi thông báo cho seller
    await models.Notification.create({
      clerk_id: finalSellerClerkId,
      message: `New order #${newOrder.id} for your gig "${gig.title}"`,
      type: 'order',
      is_read: false,
    });
  } catch (error) {
    console.error('Error creating order:', error.message);
    return next(error);
  }
};

// Lấy danh sách đơn hàng
export const getOrders = async (req, res, next) => {
  try {
    const { clerk_id } = req.params;
    const { gig_id, order_status, page = 1, limit = 10, test } = req.query;
    const offset = (page - 1) * limit;
    const where = {};

    // Xác định clerk_id theo chế độ
    let finalClerkId;
    if (test === 'true') {
      if (!clerk_id) {
        return next(createError(400, 'clerk_id is required in test mode (pass as /:id in URL)'));
      }
      finalClerkId = clerk_id;
    } else {
      if (!req.user || !req.user.clerk_id) {
        return next(createError(401, 'User authentication information is missing'));
      }
      finalClerkId = req.user.clerk_id;
    }

    if (!finalClerkId) {
      return next(createError(400, 'clerk_id is required to fetch orders'));
    }

    // Truy vấn user
    const user = await models.User.findOne({ where: { clerk_id: finalClerkId } });
    if (!user) {
      return next(createError(404, 'User not found!'));
    }

    // Xử lý user_role linh hoạt
    let roles = user.user_roles;
    if (!roles) roles = [];
    else if (typeof roles === 'string') {
      try {
        const parsed = JSON.parse(roles);
        roles = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        roles = [roles];
      }
    }

    // Debug log nếu cần
    console.log("📌 Roles sau khi xử lý:", roles);

    // Cho phép nếu là admin, seeker hoặc employer
    if (roles.includes("admin")) {
      // admin được xem tất cả
    } else if (roles.includes("seeker") || roles.includes("employer")) {
      where[Op.or] = [
        { buyer_clerk_id: finalClerkId },
        { seller_clerk_id: finalClerkId }
      ];
    } else {
      return next(createError(403, "Invalid user role"));
    }


    // Thêm điều kiện lọc thêm nếu có
    if (order_status) where.order_status = order_status;
    if (gig_id) where.gig_id = gig_id;

    const orders = await models.Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        { model: models.Gig, attributes: ['id', 'title', 'gig_image'] },
        {
          model: models.User,
          as: "buyer",
          attributes: ["clerk_id", "name", "country"],
        },
        {
          model: models.Review,
          as: "review",
          required: false,
          where: { reviewer_clerk_id: finalClerkId },
        },
      ],
    });

    const enrichedOrders = orders.rows.map((order) => ({
      ...order.get({ plain: true }),
      duration: order.order_date && order.delivery_deadline
        ? Math.ceil((new Date(order.delivery_deadline) - new Date(order.order_date)) / (1000 * 60 * 60 * 24))
        : 0,
    }));

    return res.status(200).json({
      success: true,
      total: orders.count,
      pages: Math.ceil(orders.count / limit),
      orders: enrichedOrders,
    });

  } catch (error) {
    console.error('❌ Error fetching orders:', error.message);
    return next(error);
  }
};


// Xác nhận đơn hàng (bỏ qua thanh toán)
export const confirmOrder = async (req, res, next) => {
  try {
    const { orderId, buyer_clerk_id } = req.body; // sử dụng orderId để tìm đơn hàng
    const { test } = req.query; // Kiểm tra chế độ test
    if (!orderId) {
      return next(createError(400, 'Missing orderId'));
    }

    const order = await models.Order.findOne({
      where: { id: orderId },
    });

    if (!order) {
      return next(createError(404, 'Order not found!'));
    }

    // Kiểm tra quyền: chỉ buyer của đơn hàng được xác nhận
    if (test === 'true') {
      // Chế độ test: Lấy buyer_clerk_id từ body
      if (!buyer_clerk_id) {
        return next(createError(400, 'buyer_clerk_id is required in test mode'));
      }
      if (order.buyer_clerk_id !== buyer_clerk_id) {
        return next(createError(403, 'You are not authorized to confirm this order'));
      }
    } else {
      // Chế độ bình thường: Yêu cầu xác thực
      if (!req.user || !req.user.clerk_id) {
        return next(createError(401, 'User authentication information is missing'));
      }
      if (order.buyer_clerk_id !== req.user.clerk_id) {
        return next(createError(403, 'You are not authorized to confirm this order'));
      }
    }

    // Cập nhật trạng thái đơn hàng
    order.order_status = 'in_progress';
    await order.save();

    console.log(`Order confirmed: orderId=${order.id}`);
    return res.status(200).json({ success: true, message: 'Order has been confirmed', order });
  } catch (error) {
    console.error('Error confirming order:', error.message);
    return next(error);
  }
};

// Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { order_status, clerk_id } = req.body;
    const { test } = req.query; // Kiểm tra chế độ test

    if (!id || !order_status) {
      return next(createError(400, 'Missing id or order_status'));
    }

    if (!['pending', 'in_progress', 'delivered', 'completed', 'cancelled'].includes(order_status)) {
      return next(createError(400, 'Invalid order_status'));
    }

    const order = await models.Order.findByPk(id);
    if (!order) {
      return next(createError(404, 'Order not found!'));
    }

    // Kiểm tra quyền
    let finalClerkId, finalUserRole;
    if (test === 'true') {
      if (!clerk_id) {
        return next(createError(400, 'clerk_id is required in test mode'));
      }
      finalClerkId = clerk_id;
      const user = await models.User.findOne({ where: { clerk_id: finalClerkId } });
      if (!user) {
        return next(createError(404, 'User not found!'));
      }
      finalUserRole = user.user_role;
    } else {
      if (!req.user || !req.user.clerk_id) {
        return next(createError(401, 'User authentication information is missing'));
      }
      finalClerkId = req.user.clerk_id;
      finalUserRole = req.user.user_role;
    }

    if (finalUserRole !== 'admin') {
      if (order_status === 'cancelled') {
        if (order.buyer_clerk_id !== finalClerkId) {
          return next(createError(403, 'Only the buyer can cancel this order'));
        }
        if (order.order_status === 'completed') {
          return next(createError(400, 'Cannot cancel a completed order'));
        }
      } else {
        if (order.seller_clerk_id !== finalClerkId) {
          return next(createError(403, 'Only the seller can update this order status'));
        }
      }
    }

    order.order_status = order_status;
    await order.save();

    console.log(`Order status updated: orderId=${order.id}, status=${order_status}`);
    return res.status(200).json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order status:', error.message);
    return next(error);
  }
};

// Hủy đơn hàng (bỏ qua Stripe)
export const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { buyer_clerk_id } = req.body;
    const { test } = req.query;

    const order = await models.Order.findByPk(id);
    if (!order) {
      return next(createError(404, 'Order not found!'));
    }

    let finalBuyerClerkId;
    if (test === 'true') {
      if (!buyer_clerk_id) {
        return next(createError(400, 'buyer_clerk_id is required in test mode'));
      }
      finalBuyerClerkId = buyer_clerk_id;
    } else {
      if (!req.user || !req.user.clerk_id) {
        return next(createError(401, 'User authentication information is missing'));
      }
      finalBuyerClerkId = req.user.clerk_id;
    }

    if (order.buyer_clerk_id !== finalBuyerClerkId) {
      return next(createError(403, 'Only the buyer can cancel this order'));
    }

    if (order.order_status === 'completed') {
      return next(createError(400, 'Cannot cancel a completed order'));
    }

    // Cập nhật trạng thái đơn hàng
    order.order_status = 'cancelled';
    await order.save();

    console.log(`Order cancelled: orderId=${order.id}`);
    return res.status(200).json({ success: true, message: 'Order has been cancelled', order });
  } catch (error) {
    console.error('Error cancelling order:', error.message);
    return next(error);
  }
};