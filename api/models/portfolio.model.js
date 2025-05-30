import { DataTypes } from "sequelize";

const Portfolio = (sequelize) =>
  sequelize.define(
    "Portfolio",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      seller_clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: "user_account",
          key: "clerk_id",
        },
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "category",
          key: "id",
        },
      },
      gig_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "gigs",
          key: "id",
        },
      },
      portfolio_images: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "portfolio",
      timestamps: false,
      indexes: [
        { fields: ["seller_clerk_id"] },
        { fields: ["category_id"] },
        { fields: ["gig_id"] }
      ],
    }
  );

export default Portfolio;