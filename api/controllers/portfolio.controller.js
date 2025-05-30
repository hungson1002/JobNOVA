import { models } from '../models/Sequelize-mysql.js';

const handleError = (res, error, status = 500) => {
  console.error('[Portfolio Controller] Error:', error);
  res.status(status).json({ 
    success: false, 
    message: error.message || 'Internal Server Error' 
  });
};

// Create a new portfolio
export const createPortfolio = async (req, res) => {
  try {
    if (!req.user || !req.user.clerk_id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const seller_clerk_id = req.user.clerk_id;
    const { title, description, category_id, gig_id, portfolio_images } = req.body;

    if (!title || !portfolio_images || portfolio_images.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and at least one image are required' 
      });
    }

    // Verify gig ownership if gig_id is provided
    if (gig_id) {
      const gig = await models.Gig.findOne({
        where: { id: gig_id, seller_clerk_id }
      });
      if (!gig) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only link to your own gigs' 
        });
      }
    }

    const portfolio = await models.Portfolio.create({
      seller_clerk_id,
      title,
      description,
      category_id,
      gig_id,
      portfolio_images,
    });

    // Include related data in response
    const portfolioWithRelations = await models.Portfolio.findByPk(portfolio.id, {
      include: [
        { model: models.Category },
        { model: models.Gig }
      ]
    });

    // Map lại cho frontend
    res.status(201).json({
      success: true,
      data: {
        ...portfolioWithRelations.toJSON(),
        category: portfolioWithRelations.Category
          ? { id: portfolioWithRelations.Category.id, name: portfolioWithRelations.Category.name }
          : undefined,
        gig: portfolioWithRelations.Gig
          ? { id: portfolioWithRelations.Gig.id, title: portfolioWithRelations.Gig.title }
          : undefined,
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get portfolios by seller_clerk_id
export const getPortfoliosByClerkId = async (req, res) => {
  try {
    const { seller_clerk_id, limit } = req.query;
    const queryOptions = {
      where: { seller_clerk_id },
      include: [
        { model: models.Category },
        { model: models.Gig }
      ],
      order: [['created_at', 'DESC']]
    };
    if (limit) queryOptions.limit = parseInt(limit);
    const portfolios = await models.Portfolio.findAll(queryOptions);
    res.json({
      success: true,
      portfolios: portfolios.map(p => ({
        ...p.toJSON(),
        category: p.Category ? { id: p.Category.id, name: p.Category.name } : undefined,
        gig: p.Gig ? { id: p.Gig.id, title: p.Gig.title } : undefined,
      }))
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update a portfolio
export const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, gig_id, portfolio_images } = req.body;
    const seller_clerk_id = req.user.clerk_id;
    const portfolio = await models.Portfolio.findOne({
      where: { id, seller_clerk_id }
    });
    if (!portfolio) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found or you do not have permission to update it' 
      });
    }
    // Verify gig ownership if gig_id is provided
    if (gig_id) {
      const gig = await models.Gig.findOne({
        where: { id: gig_id, seller_clerk_id }
      });
      if (!gig) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only link to your own gigs' 
        });
      }
    }
    await portfolio.update({
      title,
      description,
      category_id,
      gig_id,
      portfolio_images
    });
    // Include related data in response
    const updatedPortfolio = await models.Portfolio.findByPk(id, {
      include: [
        { model: models.Category },
        { model: models.Gig }
      ]
    });
    res.json({
      success: true,
      data: updatedPortfolio
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a portfolio
export const deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const seller_clerk_id = req.user.clerk_id;
    const portfolio = await models.Portfolio.findOne({
      where: { id, seller_clerk_id }
    });
    if (!portfolio) {
      return res.status(404).json({ 
        success: false, 
        message: 'Portfolio not found or you do not have permission to delete it' 
      });
    }
    await portfolio.destroy();
    res.status(200).json({
      success: true,
      message: 'Portfolio deleted successfully'
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get portfolios by gig_id
export const getPortfoliosByGigId = async (req, res) => {
  try {
    const { gig_id } = req.query;
    if (!gig_id) {
      return res.status(400).json({ success: false, message: "gig_id is required" });
    }
    const portfolios = await models.Portfolio.findAll({
      where: { gig_id },
      include: [
        { model: models.Category },
        { model: models.Gig }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json({
      success: true,
      portfolios: portfolios.map(p => ({
        ...p.toJSON(),
        category: p.Category
          ? { id: p.Category.id, name: p.Category.name }
          : undefined,
        gig: p.Gig
          ? { id: p.Gig.id, title: p.Gig.title }
          : undefined,
      }))
    });
  } catch (error) {
    handleError(res, error);
  }
};

