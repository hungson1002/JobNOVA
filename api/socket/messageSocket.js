import { sendMessage } from "../controllers/message.controller.js";

// Quản lý user online bằng biến toàn cục
const onlineUsers = new Set();

const messageSocketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Lưu userId cho socket để xử lý disconnect
    socket.userId = null;

    socket.on("joinOrder", ({ orderId }) => {
      if (!orderId) {
        console.error(`Client ${socket.id} provided invalid orderId`);
        return socket.emit("error", { message: "Invalid orderId" });
      }
      socket.join(`order_${orderId}`);
      console.log(`Client ${socket.id} joined room order_${orderId}`);
    });

    socket.on("joinDirect", ({ room }) => {
      socket.join(room);
      console.log(`Client ${socket.id} joined room ${room}`);
    });

    socket.on("joinUser", ({ userId }) => {
      if (!userId) return;
      socket.join(`user_${userId}`);
      socket.userId = userId;
      onlineUsers.add(userId);
      console.log(`Client ${socket.id} joined room user_${userId}`);
      // Emit cho tất cả client biết user này online
      io.emit("userOnline", { userId });
    });

    socket.on("sendMessage", async (messageData, callback) => {
      try {
        if ((!(messageData.order_id || messageData.is_direct_message)) ||
            !messageData.sender_clerk_id ||
            !messageData.receiver_clerk_id ||
            !messageData.message_content) {
          throw new Error("Missing required fields");
        }
        const newMessage = await sendMessage(messageData);
        if (!newMessage.success) throw new Error(newMessage.message);
        const room = messageData.order_id ? `order_${messageData.order_id}` : `direct_${[messageData.sender_clerk_id, messageData.receiver_clerk_id].sort().join("_")}`;
        io.to(room).emit("newMessage", newMessage);
        io.to(`user_${messageData.receiver_clerk_id}`).emit("newMessage", newMessage);
        callback({ success: true, message: newMessage });
      } catch (error) {
        console.error("Error sending message:", error.message);
        callback({ success: false, error: error.message });
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        // Emit cho tất cả client biết user này offline
        io.emit("userOffline", { userId: socket.userId });
      }
      console.log("Client disconnected:", socket.id);
    });

    socket.on("error", (error) => {
      console.error(`Socket error for client ${socket.id}:`, error);
    });

    // API kiểm tra online
    socket.on("checkOnline", ({ userId }, callback) => {
      callback(onlineUsers.has(userId));
    });
  });
};

export default messageSocketHandler;