// gigRequirementTemplate.controller.js
import { models } from "../models/Sequelize-mysql.js";

// Tạo requirement templates cho một gig
export const createGigRequirementTemplates = async (req, res) => {
  try {
    const { gig_id, requirements } = req.body;

    if (!gig_id || !Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: gig_id or requirements array",
      });
    }

    // Kiểm tra gig tồn tại
    const gig = await models.Gig.findByPk(gig_id);
    if (!gig) {
      return res.status(404).json({ success: false, message: "Gig not found" });
    }

    // Tạo các requirement templates
    const requirementTemplates = requirements.map((req) => ({
      gig_id,
      requirement_text: req.requirement,
      is_required: req.required || true,
    }));

    const createdTemplates = await models.GigRequirementTemplate.bulkCreate(requirementTemplates);
    return res.status(201).json({
      success: true,
      message: "Requirement templates created successfully",
      data: createdTemplates,
    });
  } catch (error) {
    console.error("Error creating requirement templates:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error creating requirement templates",
      error: error.message,
    });
  }
};

// Lấy tất cả requirement templates của một gig
export const getGigRequirementTemplates = async (req, res) => {
  try {
    const { gig_id } = req.params;

    if (!gig_id) {
      return res.status(400).json({ success: false, message: "Missing gig_id" });
    }

    const templates = await models.GigRequirementTemplate.findAll({
      where: { gig_id },
    });

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (error) {
    console.error("Error fetching requirement templates:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error fetching requirement templates",
      error: error.message,
    });
  }
};

// Cập nhật requirement template
export const updateGigRequirementTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { requirement_text, is_required } = req.body;

    const template = await models.GigRequirementTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Requirement template not found" });
    }

    await template.update({ requirement_text, is_required });
    return res.status(200).json({
      success: true,
      message: "Requirement template updated successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error updating requirement template:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error updating requirement template",
      error: error.message,
    });
  }
};

// Xóa requirement template
export const deleteGigRequirementTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const template = await models.GigRequirementTemplate.findByPk(id);
    if (!template) {
      return res.status(404).json({ success: false, message: "Requirement template not found" });
    }

    await template.destroy();
    return res.status(200).json({
      success: true,
      message: "Requirement template deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting requirement template:", error.message);
    return res.status(500).json({
      success: false,
      message: "Error deleting requirement template",
      error: error.message,
    });
  }
};