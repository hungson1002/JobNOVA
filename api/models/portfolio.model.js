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
      clerk_id: {
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
      portfolio_url: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      portfolio_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      portfolio_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
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
        { fields: ["clerk_id"]}
      ],
    }
  );

export default Portfolio;