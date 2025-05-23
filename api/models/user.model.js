import { DataTypes } from "sequelize";

const User = (sequelize) =>
  sequelize.define(
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
      name: {
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
  defaultValue: ["seeker"]
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
    },
    {
      tableName: "user_account",
      timestamps: false,
    }
  );

export default User;
