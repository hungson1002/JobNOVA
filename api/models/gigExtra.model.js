import { DataTypes } from "sequelize";

const GigExtra = (sequelize) =>
  sequelize.define(
    "GigExtras",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      gig_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "gigs",
          key: "id",
        },
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      extra_delivery_time: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: "gig_extras",
      timestamps: false,
    }
  );

export default GigExtra;