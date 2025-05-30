import { DataTypes } from "sequelize";

const defineReportModel = (sequelize) => {
  const Report = sequelize.define(
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
        type: DataTypes.INTEGER,
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

  // ✅ GẮN associate trực tiếp vào instance
  Report.associate = (models) => {
    Report.belongsTo(models.Gig, {
      foreignKey: "target_id",
      targetKey: "id",
      as: "gig",
      constraints: false,
    });

    Report.belongsTo(models.User, {
      foreignKey: "reporter_clerk_id",
      targetKey: "clerk_id",
      as: "reporter",
      constraints: false,
    });
  };

  return Report;
};

export default defineReportModel;
