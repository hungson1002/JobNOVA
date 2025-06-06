import { models } from '../models/Sequelize-mysql.js';

// Tạo SeekerSkill
export const createSeekerSkill = async (req, res, next) => {
  try {
    const { clerk_id, skill_id } = req.body;
    if (!clerk_id || !skill_id) {
      return res.status(400).json({ success: false, message: 'Missing required fields: clerk_id and skill_id' });
    }
    
    // Check if skill already exists for this user
    const existingSkill = await models.SeekerSkill.findOne({
      where: { clerk_id, skill_id }
    });
    
    if (existingSkill) {
      return res.status(409).json({ success: false, message: 'Skill already added to your profile' });
    }
    
    const seekerSkill = await models.SeekerSkill.create({ clerk_id, skill_id });
    console.log(`SeekerSkill created: clerk_id=${clerk_id}, skill_id=${skill_id}`);
    return res.status(201).json({ success: true, message: 'SeekerSkill created successfully', seekerSkill });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ success: false, message: 'Skill already added to your profile' });
    }
    console.error('Error creating SeekerSkill:', error.message);
    return res.status(500).json({ success: false, message: 'Error creating SeekerSkill', error: error.message });
  }
};

// Lấy tất cả SeekerSkill
export const getAllSeekerSkills = async (req, res, next) => {
  try {
    const seekerSkills = await models.SeekerSkill.findAll();
    return res.status(200).json({ success: true, seekerSkills });
  } catch (error) {
    console.error('Error fetching SeekerSkills:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching SeekerSkills', error: error.message });
  }
};

// Lấy SeekerSkill theo ID
export const getSeekerSkillById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seekerSkill = await models.SeekerSkill.findByPk(id);
    if (!seekerSkill) {
      return res.status(404).json({ success: false, message: 'SeekerSkill not found' });
    }
    return res.status(200).json({ success: true, seekerSkill });
  } catch (error) {
    console.error('Error fetching SeekerSkill:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching SeekerSkill', error: error.message });
  }
};

// Cập nhật SeekerSkill
export const updateSeekerSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clerk_id, skill_id } = req.body;
    const seekerSkill = await models.SeekerSkill.findByPk(id);
    if (!seekerSkill) {
      return res.status(404).json({ success: false, message: 'SeekerSkill not found' });
    }
    await seekerSkill.update({ clerk_id, skill_id });
    console.log(`SeekerSkill updated: id=${id}`);
    return res.status(200).json({ success: true, message: 'SeekerSkill updated successfully', seekerSkill });
  } catch (error) {
    console.error('Error updating SeekerSkill:', error.message);
    return res.status(500).json({ success: false, message: 'Error updating SeekerSkill', error: error.message });
  }
};

// Xóa SeekerSkill
export const deleteSeekerSkill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const seekerSkill = await models.SeekerSkill.findByPk(id);
    if (!seekerSkill) {
      return res.status(404).json({ success: false, message: 'SeekerSkill not found' });
    }
    await seekerSkill.destroy();
    console.log(`SeekerSkill deleted: id=${id}`);
    return res.status(200).json({ success: true, message: 'SeekerSkill deleted successfully' });
  } catch (error) {
    console.error('Error deleting SeekerSkill:', error.message);
    return res.status(500).json({ success: false, message: 'Error deleting SeekerSkill', error: error.message });
  }
};

// Lấy danh sách kỹ năng của một người tìm việc
export const getSkillsByClerkId = async (req, res, next) => {
  try {
    const { clerk_id } = req.params;
    console.log('Fetching skills for clerk_id:', clerk_id);
    
    const seekerSkills = await models.SeekerSkill.findAll({ 
      where: { clerk_id },
      include: [{
        model: models.Skills,
        attributes: ['id', 'name']
      }]
    });
    
    console.log('Found seekerSkills:', JSON.stringify(seekerSkills, null, 2));
    return res.status(200).json({ success: true, seekerSkills });
  } catch (error) {
    console.error('Error fetching skills by clerk_id:', error.message);
    console.error('Full error:', error);
    return res.status(500).json({ success: false, message: 'Error fetching skills by clerk_id', error: error.message });
  }
};

// Lấy danh sách người tìm việc theo kỹ năng
export const getSeekersBySkillId = async (req, res, next) => {
  try {
    const { skill_id } = req.params;
    const seekerSkills = await models.SeekerSkill.findAll({ where: { skill_id } });
    return res.status(200).json({ success: true, seekerSkills });
  } catch (error) {
    console.error('Error fetching seekers by skill_id:', error.message);
    return res.status(500).json({ success: false, message: 'Error fetching seekers by skill_id', error: error.message });
  }
};