import { models } from '../models/Sequelize-mysql.js';

const handleError = (res, error, status = 500) => {
  console.error(error);
  res.status(status).json({ error: error.message || 'Internal Server Error' });
};

// Create a gig extra
export const createGigExtra = async (req, res) => {
  try {
    const { gig_id, title, description, price, extra_delivery_time } = req.body;
    const gig = await models.Gig.findByPk(gig_id);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }
    if (!req.user || req.user.clerk_id !== gig.seller_clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!title || !price) {
      return res.status(400).json({ error: 'Title and price are required' });
    }
    const gigExtra = await models.GigExtras.create({
      gig_id,
      title,
      description,
      price,
      extra_delivery_time,
    });
    res.status(201).json(gigExtra);
  } catch (error) {
    handleError(res, error);
  }
};

// Get gig extras by gig_id
export const getGigExtrasByGigId = async (req, res) => {
  try {
    const { gig_id } = req.params;
    const extras = await models.GigExtras.findAll({ where: { gig_id } });
    res.json(extras);
  } catch (error) {
    handleError(res, error);
  }
};

// Update a gig extra
export const updateGigExtra = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, extra_delivery_time } = req.body;
    const gigExtra = await models.GigExtras.findByPk(id, {
      include: [{ model: models.Gig, attributes: ['seller_clerk_id'] }],
    });
    if (!gigExtra) {
      return res.status(404).json({ error: 'Gig extra not found' });
    }
    if (!req.user || req.user.clerk_id !== gigExtra.Gig.seller_clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await gigExtra.update({ title, description, price, extra_delivery_time });
    res.json(gigExtra);
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a gig extra
export const deleteGigExtra = async (req, res) => {
  try {
    const { id } = req.params;
    const gigExtra = await models.GigExtras.findByPk(id, {
      include: [{ model: models.Gig, attributes: ['seller_clerk_id'] }],
    });
    if (!gigExtra) {
      return res.status(404).json({ error: 'Gig extra not found' });
    }
    if (!req.user || req.user.clerk_id !== gigExtra.Gig.seller_clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await gigExtra.destroy();
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
};