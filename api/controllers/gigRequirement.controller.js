import { models } from '../models/Sequelize-mysql.js';

const handleError = (res, error, status = 500) => {
  console.error(error);
  res.status(status).json({ error: error.message || 'Internal Server Error' });
};

// Create a gig requirement
export const createGigRequirement = async (req, res) => {
  try {
    const { order_id, requirement_text } = req.body;
    const order = await models.Order.findByPk(order_id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    if (!req.user || req.user.clerk_id !== order.buyer_clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!requirement_text) {
      return res.status(400).json({ error: 'Requirement text is required' });
    }
    const requirement = await models.GigRequirements.create({
      order_id,
      requirement_text,
    });
    res.status(201).json(requirement);
  } catch (error) {
    handleError(res, error);
  }
};

// Get gig requirements by order_id
export const getGigRequirementsByOrderId = async (req, res) => {
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
    const requirements = await models.GigRequirements.findAll({ where: { order_id } });
    res.json(requirements);
  } catch (error) {
    handleError(res, error);
  }
};