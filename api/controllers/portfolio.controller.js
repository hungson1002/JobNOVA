import { models } from '../models/Sequelize-mysql.js';

const handleError = (res, error, status = 500) => {
  console.error(error);
  res.status(status).json({ error: error.message || 'Internal Server Error' });
};

// Create a new portfolio
export const createPortfolio = async (req, res) => {
  try {
    const { clerk_id, title, description, file_url, file_size, file_type } = req.body;
    if (!req.user || req.user.clerk_id !== clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!title || !file_url) {
      return res.status(400).json({ error: 'Title and file_url are required' });
    }
    const portfolio = await models.Portfolio.create({
      clerk_id,
      title,
      description,
      file_url,
      file_size,
      file_type,
    });
    res.status(201).json(portfolio);
  } catch (error) {
    handleError(res, error);
  }
};

// Get portfolios by clerk_id
export const getPortfoliosByClerkId = async (req, res) => {
  try {
    const { clerk_id } = req.params;
    const portfolios = await models.Portfolio.findAll({ where: { clerk_id } });
    res.json(portfolios);
  } catch (error) {
    handleError(res, error);
  }
};

// Update a portfolio
export const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, file_url, file_size, file_type } = req.body;
    const portfolio = await models.Portfolio.findByPk(id);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    if (!req.user || req.user.clerk_id !== portfolio.clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await portfolio.update({ title, description, file_url, file_size, file_type });
    res.json(portfolio);
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a portfolio
export const deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await models.Portfolio.findByPk(id);
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    if (!req.user || req.user.clerk_id !== portfolio.clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await portfolio.destroy();
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
};