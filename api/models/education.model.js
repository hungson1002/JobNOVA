import { DataTypes } from "sequelize";

const Education = (sequelize) =>
  sequelize.define(
    "Education",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      school: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      degree: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      major: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      year_of_graduation: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "education",
      timestamps: false,
    }
  );

export default Education; 