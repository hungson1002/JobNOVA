import { DataTypes } from "sequelize";

const Order = (sequelize) =>
  sequelize.define(
    "Order",
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
      buyer_clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: "user_account",
          key: "clerk_id",
        },
      },
      seller_clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: "user_account",
          key: "clerk_id",
        },
      },
      order_status: {
        type: DataTypes.ENUM(
          "pending",
          "in_progress",
          "delivered",
          "completed",
          "cancelled"
        ),
        allowNull: false,
        defaultValue: "pending",
      },
      total_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      order_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      delivery_deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      requirements: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "orders",
      timestamps: false,
      indexes: [
        { fields: ["buyer_clerk_id"] },
        { fields: ["seller_clerk_id"] },
        { fields: ["gig_id"] },
      ],
    }
  );


export default Order;