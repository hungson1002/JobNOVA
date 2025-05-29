import { models } from "../models/Sequelize-mysql.js";

// Thêm banner
export const createBannerSlide = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Missing image file" });
    }

    const { title, subtitle, cta_link } = req.body;

    const banner = await models.BannerSlide.create({
      image_data: req.file.buffer,
      image_type: req.file.mimetype,
      title,
      subtitle,
      cta_link,
      position: await getNextPosition(),
    });

    return res.status(201).json({ success: true, banner });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Cập nhật banner
export const updateBannerSlide = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, cta_link } = req.body;

    const banner = await models.BannerSlide.findByPk(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    banner.title = title;
    banner.subtitle = subtitle;
    banner.cta_link = cta_link;

    if (req.file) {
      banner.image_data = req.file.buffer;
      banner.image_type = req.file.mimetype;
    }

    await banner.save();

    return res.status(200).json({ success: true, message: "Banner updated successfully", banner });
  } catch (error) {
    console.error("Lỗi khi cập nhật banner:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Xoá banner
export const deleteBannerSlide = async (req, res) => {
  try {
    const id = req.params.id;

    const banner = await models.BannerSlide.findByPk(id);
    if (!banner) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy slide để xóa",
      });
    }

    await banner.destroy();

    return res.status(200).json({
      success: true,
      message: "Xóa slide thành công",
    });
  } catch (error) {
    console.error("Lỗi khi xóa slide:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa slide",
    });
  }
};

// Lấy tất cả banner
export const getAllBannerSlides = async (req, res) => {
  try {
    const banners = await models.BannerSlide.findAll({ order: [["position", "ASC"]] });


    const formatted = banners.map(b => ({
      id: b.id,
      title: b.title,
      subtitle: b.subtitle,
      image: `data:${b.image_type};base64,${b.image_data.toString("base64")}`,
      cta_link: b.cta_link || "/search"
    }));

    return res.status(200).json({ success: true, banners: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Cập nhật vị trí banner
export const updatePosition = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body;

    const banner = await models.BannerSlide.findByPk(id);
    if (!banner) {
      return res.status(404).json({ success: false, message: "Banner not found" });
    }

    const banners = await models.BannerSlide.findAll({
      order: [['position', 'ASC']]
    });

    const currentIndex = banners.findIndex(b => b.id === banner.id);
    
    if (direction === 'up' && currentIndex > 0) {
      // Swap positions with the banner above
      const temp = banners[currentIndex - 1].position;
      banners[currentIndex - 1].position = banner.position;
      banner.position = temp;
      
      await banners[currentIndex - 1].save();
      await banner.save();
    } else if (direction === 'down' && currentIndex < banners.length - 1) {
      // Swap positions with the banner below
      const temp = banners[currentIndex + 1].position;
      banners[currentIndex + 1].position = banner.position;
      banner.position = temp;
      
      await banners[currentIndex + 1].save();
      await banner.save();
    } else {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot move ${direction}, banner is at the ${direction === 'up' ? 'top' : 'bottom'}`
      });
    }

    return res.status(200).json({ success: true, message: "Position updated successfully" });
  } catch (error) {
    console.error("Error updating position:", error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Helper function to get next position value
const getNextPosition = async () => {
  const maxPosition = await models.BannerSlide.max('position') || 0;
  return maxPosition + 1;
};
