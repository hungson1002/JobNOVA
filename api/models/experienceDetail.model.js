import { DataTypes } from "sequelize";

const ExperienceDetail = (sequelize) =>
  sequelize.define(
    "ExperienceDetail",
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
      certificate_degree_name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      major: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      cgpa: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
          isValidEndDate(value) {
            if (value && this.start_date && value < this.start_date) {
              throw new Error("end_date must be after start_date");
            }
          },
        },
      },
      is_current_job: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      job_title: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "experience_detail",
      timestamps: false,
    }
  );

export default ExperienceDetail;