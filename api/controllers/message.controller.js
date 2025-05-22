
import { models } from "../models/Sequelize-mysql.js";
import { Op } from "sequelize";

let io;

export const initSocket = (socketIo) => {
  // io = socketIo;
  // io.on("connection", (socket) => {
  //   socket.on("viewChat", async ({ orderId, userId }) => {
  //     try {
  //       const messages = await models.Message.findAll({
  //         where: {
  //           order_id: orderId,
  //           is_read: false,
  //           sender_clerk_id: { [Op.ne]: userId },
  //         },
  //       });

  //       if (messages.length === 0) return;

  //       const messageIds = messages.map((msg) => msg.id);
  //       await models.Message.update(
  //         { is_read: true },
  //         { where: { id: messageIds } }
  //       );

  //       io.to(`order_${orderId}`).emit("messagesRead", { orderId, messageIds });
  //     } catch (err) {
  //       console.error("Error marking messages as read:", err.message);
  //       socket.emit("error", { message: "Failed to mark messages as read" });
  //     }
  io = socketIo;
  io.on("connection", (socket) => {
    // Xử lý khi người dùng tham gia chat
    socket.on("joinChat", ({ userId, sellerId }) => {
      // Tạo room cho tin nhắn trực tiếp dựa trên sender và receiver
      const directRoom = `direct_${[userId, sellerId].sort().join("_")}`;
      socket.join(directRoom);
    });

    socket.on("viewChat", async ({ orderId, userId }) => {
      try {
        const messages = await models.Message.findAll({
          where: {
            order_id: orderId,
            is_read: false,
            sender_clerk_id: { [Op.ne]: userId },
          },
        });

        if (messages.length === 0) return;

        const messageIds = messages.map((msg) => msg.id);
        await models.Message.update(
          { is_read: true },
          { where: { id: messageIds } }
        );

        io.to(`order_${orderId}`).emit("messagesRead", { orderId, messageIds });
      } catch (err) {
        console.error("Error marking messages as read:", err.message);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });
  });
};

const validateOrder = async (order_id, sender_clerk_id, receiver_clerk_id) => {
  const order = await models.Order.findByPk(order_id);
  if (!order) throw new Error("Order not found");
  if (order.order_status === "completed" || order.order_status === "cancelled") {
    throw new Error("Cannot send messages for completed or cancelled orders");
  }
  if (
    ![order.buyer_clerk_id, order.seller_clerk_id].includes(sender_clerk_id) ||
    ![order.buyer_clerk_id, order.seller_clerk_id].includes(receiver_clerk_id)
  ) {
    throw new Error("Invalid sender or receiver");
  }
  return order;
};

export const getMessages = async (req, res, next) => {
  try {
    const { order_id, limit = 50, offset = 0 } = req.query;
    if (!order_id) return res.status(400).json({ success: false, message: "Missing order_id" });

    const messages = await models.Message.findAll({
      where: { order_id },
      attributes: ["id", "order_id", "sender_clerk_id", "receiver_clerk_id", "message_content", "sent_at", "is_read", "ticket_status"],
      order: [["sent_at", "ASC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    console.error("Error fetching messages:", err.message);
    next(err);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { order_id, sender_clerk_id, receiver_clerk_id, message_content } = req.body || req;

    // Kiểm tra sender_clerk_id và receiver_clerk_id có tồn tại trong bảng user_account không
    const sender = await models.User.findOne({ where: { clerk_id: sender_clerk_id } });
    const receiver = await models.User.findOne({ where: { clerk_id: receiver_clerk_id } });
    if (!sender) {
      const error = { success: false, message: "Sender does not exist" };
      if (res) return res.status(400).json(error);
      return error;
    }
    if (!receiver) {
      const error = { success: false, message: "Receiver does not exist" };
      if (res) return res.status(400).json(error);
      return error;
    }
    // Nếu có order_id, validate order
    if (order_id) {
      await validateOrder(order_id, sender_clerk_id, receiver_clerk_id);
    }

    const message = await models.Message.create({
      order_id: order_id || null,
      ticket_id: order_id || null, // Nếu không có order_id, ticket_id cũng để null
      ticket_status: "open",
      is_direct_message: !order_id, // Đánh dấu là tin nhắn trực tiếp nếu không có order_id
      sender_clerk_id,
      receiver_clerk_id,
      message_content,
      sent_at: sent_at ? new Date(sent_at) : new Date(),
      is_read: false,
    });

    if (io) {
      const messageWithISODate = {
        ...message.toJSON(),
        sent_at: message.sent_at.toISOString(),
      };
      // io.to(`order_${order_id}`).emit("newMessage", messageWithISODate);
      // Nếu là tin nhắn trực tiếp, sử dụng room dựa trên sender và receiver
      const room = order_id ? `order_${order_id}` : `direct_${[sender_clerk_id, receiver_clerk_id].sort().join("_")}`;
      io.to(room).emit("newMessage", messageWithISODate);
    }

    const response = { success: true, message };
    return res ? res.status(201).json(response) : response;
  } catch (err) {
    const errorMessage = err.message || "Server error";
    console.error("Error sending message:", errorMessage, err.stack);
    if (next) return next(err);
    return { success: false, message: errorMessage };
  }
};

export const markMessageAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await models.Message.findByPk(id);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    message.is_read = true;
    await message.save();

    if (io) io.to(`order_${message.order_id}`).emit("messageUpdated", message);

    res.status(200).json({ success: true, message });
  } catch (err) {
    console.error("Error marking message as read:", err.message);
    next(err);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    const { clerk_id } = req.query;
    if (!clerk_id) return res.status(400).json({ success: false, message: "Missing clerk_id" });

    const orders = await models.Order.findAll({
      where: {
        [Op.or]: [{ buyer_clerk_id: clerk_id }, { seller_clerk_id: clerk_id }],
      },
      attributes: ["id", "buyer_clerk_id", "seller_clerk_id", "order_status"],
      include: [
        {
          model: models.Message,
          as: "Messages",
          attributes: ["id", "message_content", "sent_at", "is_read", "ticket_status"],
          required: false,
        },
      ],
    });

    const tickets = orders.map((order) => ({
      ticket_id: order.id,
      order_id: order.id,
      buyer_clerk_id: order.buyer_clerk_id,
      seller_clerk_id: order.seller_clerk_id,
      order_status: order.order_status,
      status: order.Messages.length > 0 ? order.Messages[0].ticket_status : "open",
      last_message: order.Messages.length > 0 ? order.Messages[order.Messages.length - 1] : null,
      message_count: order.Messages.length,
    }));

    res.status(200).json({ success: true, tickets });
  } catch (err) {
    console.error("Error fetching tickets:", err.message);
    next(err);
  }
};

export const updateTicketStatus = async (req, res, next) => {
  try {
    const { order_id, ticket_status, clerk_id } = req.body;
    if (!order_id || !ticket_status || !clerk_id) return res.status(400).json({ success: false, message: "Missing order_id, ticket_status or clerk_id" });
    if (!["open", "closed"].includes(ticket_status)) return res.status(400).json({ success: false, message: "Invalid ticket_status" });

    const order = await models.Order.findByPk(order_id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (![order.buyer_clerk_id, order.seller_clerk_id].includes(clerk_id)) {
      return res.status(403).json({ success: false, message: "You are not authorized to update this ticket" });
    }

    const messageCount = await models.Message.count({ where: { order_id } });
    if (messageCount === 0) {
      await models.Message.create({
        order_id,
        ticket_id: order_id,
        ticket_status,
        sender_clerk_id: clerk_id,
        receiver_clerk_id: order.buyer_clerk_id === clerk_id ? order.seller_clerk_id : order.buyer_clerk_id,
        message_content: `Ticket ${ticket_status} by ${clerk_id}`,
        sent_at: new Date(),
        is_read: false,
      });
    } else {
      const [updated] = await models.Message.update(
        { ticket_status },
        { where: { order_id } }
      );
      if (updated === 0) return res.status(404).json({ success: false, message: "No ticket found" });
    }

    if (io) io.to(`order_${order_id}`).emit("ticketUpdated", { order_id, ticket_status });

    res.status(200).json({ success: true, message: "Ticket status updated" });
  } catch (err) {
    console.error("Error updating ticket status:", err.message);
    next(err);
  }
};