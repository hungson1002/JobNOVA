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
      where: {
        target_type: "service", // lọc chỉ report gig
      },
      order: [["created_at", "DESC"]],
      include: [
        {
          model: models.Gig,
          as: "gig",
          attributes: ["title", "seller_clerk_id"],
          required: false,
        },
        {
          model: models.User,
          as: "reporter",
          attributes: ["firstname", "lastname"], // thay vì name
        },
      ],
    });

    const formatted = reports.map((r) => ({
      id: r.id,
      gig_title: r.gig?.title || "N/A",
      seller: r.gig?.seller_clerk_id || "Unknown",
      report_reason: r.reason,
      description: r.description,
      reported_by: r.reporter
        ? `${r.reporter.firstname ?? ""} ${r.reporter.lastname ?? ""}`.trim()
        : r.reporter_clerk_id,
      report_date: r.created_at,
      status: "pending", // có thể đổi sau nếu có cột status
    }));

    return res.status(200).json({ success: true, reports: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
