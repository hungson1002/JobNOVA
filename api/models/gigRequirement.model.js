import { DataTypes } from "sequelize";

const GigRequirements = (sequelize) =>
  sequelize.define(
    "GigRequirements",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
      },
      requirement_text: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "gig_requirements",
      timestamps: false,
    }
  );

export default GigRequirements;