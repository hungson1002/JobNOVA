import { models } from '../models/Sequelize-mysql.js';
import { sequelize } from '../models/Sequelize-mysql.js';

const handleError = (res, error, status = 500) => {
  console.error(error);
  res.status(status).json({ error: error.message || 'Internal Server Error' });
};

// Create an order extra
export const createOrderExtra = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { order_id, gig_extra_id, price, extra_delivery_time } = req.body;
    const order = await models.Order.findByPk(order_id, { transaction });
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!req.user || req.user.clerk_id !== order.buyer_clerk_id) {
      await transaction.rollback();
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const gigExtra = await models.GigExtras.findByPk(gig_extra_id, { transaction });
    if (!gigExtra) {
      await transaction.rollback();
      return res.status(404).json({ error: 'Gig extra not found' });
    }
    if (price <= 0) {
      await transaction.rollback();
      return res.status(400).json({ error: 'Invalid price' });
    }
    const orderExtra = await models.OrderExtra.create({
      order_id,
      gig_extra_id,
      price,
      extra_delivery_time,
    }, { transaction });
    await transaction.commit();
    res.status(201).json(orderExtra);
  } catch (error) {
    await transaction.rollback();
    handleError(res, error);
  }
};

// Get order extras by order_id
export const getOrderExtrasByOrderId = async (req, res) => {
  try {
    const { order_id } = req.params;
    const order = await models.Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!req.user || (
      ![order.buyer_clerk_id, order.seller_clerk_id].includes(req.user.clerk_id) &&
      req.user.user_role !== 'admin'
    )) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const orderExtras = await models.OrderExtra.findAll({ where: { order_id } });
    res.json(orderExtras);
  } catch (error) {
    handleError(res, error);
  }
};

// Delete an order extra
export const deleteOrderExtra = async (req, res) => {
  try {
    const { id } = req.params;
    const orderExtra = await models.OrderExtra.findByPk(id, {
      include: [{ model: models.Order, attributes: ['buyer_clerk_id'] }],
    });
    if (!orderExtra) {
      return res.status(404).json({ error: 'Order extra not found' });
    }
    if (!req.user || req.user.clerk_id !== orderExtra.Order.buyer_clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await orderExtra.destroy();
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
};