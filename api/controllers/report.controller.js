import { models } from "../models/Sequelize-mysql.js";

// Tạo report
export const createReport = async (req, res) => {
  try {
    const { target_type, target_id, reason, description } = req.body;
    const reporter_clerk_id = req.user.clerk_id;

    if (!target_type || !target_id || !reason || !reporter_clerk_id) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const report = await models.Report.create({
      reporter_clerk_id,
      target_type,
      target_id,
      reason,
      description,
    });

    return res.status(201).json({ success: true, message: "Report submitted", report });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Lấy tất cả report (admin)
export const getAllReports = async (req, res) => {
  try {
    const reports = await models.Report.findAll({
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ success: true, reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
