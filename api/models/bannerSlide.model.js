import { DataTypes } from "sequelize";

const BannerSlide = (sequelize) =>
  sequelize.define(
    "BannerSlide",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      image_data: {
        type: DataTypes.BLOB("long"), // lưu ảnh nhị phân
        allowNull: false,
      },
      image_type: {
        type: DataTypes.STRING(50), // ví dụ "image/jpeg"
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      subtitle: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "banner_slides",
      timestamps: false,
    }
  );

export default BannerSlide;
