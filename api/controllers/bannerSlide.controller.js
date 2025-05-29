import { models } from "../models/Sequelize-mysql.js";

// Thêm banner
export const createBannerSlide = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Missing image file" });
    }

    const { title, subtitle } = req.body;

    const banner = await models.BannerSlide.create({
      image_data: req.file.buffer,
      image_type: req.file.mimetype,
      title,
      subtitle,
    });

    return res.status(201).json({ success: true, banner });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Xoá banner
export const deleteBannerSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await models.BannerSlide.findByPk(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    await banner.destroy();
    return res.status(200).json({ success: true, message: "Banner deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Lấy tất cả banner
export const getAllBannerSlides = async (req, res) => {
  try {
    const banners = await models.BannerSlide.findAll({ order: [["created_at", "DESC"]] });

    const formatted = banners.map(b => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      image: `data:${b.image_type};base64,${b.image_data.toString("base64")}`,
    }));

    return res.status(200).json({ success: true, banners: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
