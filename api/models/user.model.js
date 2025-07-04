import { DataTypes } from "sequelize";

const User = (sequelize) => {
  const UserModel = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[A-Za-z0-9_-]+$/,
        },
      },
      country: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      firstname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastname: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      user_roles: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: ["seeker"],
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender: {
        type: DataTypes.TINYINT,
        allowNull: true,
      },
      contact_number: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      registration_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      is_banned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      languages: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      plan_to_use: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      checklist_status: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      preferred_days: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      preferred_hours: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "user_account",
      timestamps: false,
    }
  );

  UserModel.associate = (models) => {
    UserModel.hasMany(models.Gig, {
      foreignKey: "seller_clerk_id",
      sourceKey: "clerk_id",
    });
  };

  return UserModel;
};

export default User;
