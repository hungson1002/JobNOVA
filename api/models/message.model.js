import { DataTypes } from "sequelize";

const Message = (sequelize) =>
  sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "orders",
          key: "id",
        },
      },
      ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      ticket_status: {
        type: DataTypes.ENUM("open", "closed"),
        allowNull: false,
        defaultValue: "open",
      },
      is_direct_message: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false, // Phân biệt tin nhắn trực tiếp
      },
      sender_clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: "user_account",
          key: "clerk_id",
        },
      },
      receiver_clerk_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
        references: {
          model: "user_account",
          key: "clerk_id",
        },
      },
      message_content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sent_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "messages",
      timestamps: false,
      indexes: [
        { fields: ["order_id"] }, // Thêm index để tối ưu truy vấn
        { fields: ["ticket_id"] },
        { fields: ["sender_clerk_id", "receiver_clerk_id"] }, // Thêm index để tối ưu truy vấn tin nhắn trực tiếp
      ],
    }
  );

export default Message;