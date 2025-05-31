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
      image: {
        type: DataTypes.STRING(500), // Lưu URL Cloudinary
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
      position: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      cta_link: {
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
