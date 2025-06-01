export default function notificationSocketHandler(io) {
    io.on("connection", (socket) => {
      console.log("🔌 Notification socket connected:", socket.id);
  
      // Client gửi clerk_id để join vào "room" riêng
      socket.on("join_notification_room", (clerk_id) => {
        socket.join(clerk_id);
        console.log(`👤 Joined notification room: ${clerk_id}`);
      });
  
      socket.on("disconnect", () => {
        console.log("🔌 Notification socket disconnected:", socket.id);
      });
    });
  }
  