import { models } from '../models/Sequelize-mysql.js';

const handleError = (res, error, status = 500) => {
  console.error(error);
  res.status(status).json({ error: error.message || 'Internal Server Error' });
};

// Create a new FAQ
export const createGigFaq = async (req, res) => {
  try {
    const { gig_id, question, answer } = req.body;
    const gig = await models.Gig.findByPk(gig_id);
    if (!gig) {
      return res.status(404).json({ error: 'Gig not found' });
    }
    if (!req.user || req.user.clerk_id !== gig.seller_clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }
    const faq = await models.GigFaq.create({ gig_id, question, answer });
    res.status(201).json(faq);
  } catch (error) {
    handleError(res, error);
  }
};

// Get FAQs by gig_id
export const getGigFaqsByGigId = async (req, res) => {
  try {
    const { gig_id } = req.params;
    const faqs = await models.GigFaq.findAll({ where: { gig_id } });
    res.json(faqs);
  } catch (error) {
    handleError(res, error);
  }
};

// Update a FAQ
export const updateGigFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;
    const faq = await models.GigFaq.findByPk(id, {
      include: [{ model: models.Gig, attributes: ['seller_clerk_id'] }],
    });
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    if (!req.user || req.user.clerk_id !== faq.Gig.seller_clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await faq.update({ question, answer });
    res.json(faq);
  } catch (error) {
    handleError(res, error);
  }
};

// Delete a FAQ
export const deleteGigFaq = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await models.GigFaq.findByPk(id, {
      include: [{ model: models.Gig, attributes: ['seller_clerk_id'] }],
    });
    if (!faq) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    if (!req.user || req.user.clerk_id !== faq.Gig.seller_clerk_id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await faq.destroy();
    res.status(204).send();
  } catch (error) {
    handleError(res, error);
  }
};