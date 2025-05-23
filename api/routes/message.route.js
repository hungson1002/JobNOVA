import express from "express";
import { getMessages, sendMessage, markMessageAsRead, getTickets, updateTicketStatus, getDirectMessages } from "../controllers/message.controller.js";

const router = express.Router();

// Lấy danh sách tin nhắn theo order_id
router.get("/", getMessages);

// Gửi tin nhắn mới
router.post("/", sendMessage);

// Đánh dấu tin nhắn là đã xem
router.patch("/:id/read", markMessageAsRead);

// Lấy danh sách ticket
router.get("/tickets", getTickets);

// Cập nhật trạng thái ticket
router.patch("/tickets", updateTicketStatus);

// Lấy direct messages giữa 2 user hoặc tất cả direct messages của user
router.get("/direct", getDirectMessages);

export default router;