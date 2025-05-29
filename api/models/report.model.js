import { DataTypes } from "sequelize";

const Report = (sequelize) =>
  sequelize.define(
    "Report",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      reporter_clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      target_type: {
        type: DataTypes.ENUM("user", "service", "order"),
        allowNull: false,
      },
      target_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      reason: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "reports",
      timestamps: false,
    }
  );

export default Report;
