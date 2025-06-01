"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import  io  from "socket.io-client";
// import type { Socket } from "socket.io-client";
import { fetchMessages, fetchTickets, fetchDirectMessages } from "@/lib/api";

export interface Message {
  id: number;
  order_id: number | null;
  ticket_id: number | null;
  sender_clerk_id: string;
  receiver_clerk_id: string;
  message_content: string;
  sent_at: string;
  is_read: boolean;
  is_direct_message: boolean;
  ticket_status: "open" | "closed";
}

export interface Ticket {
  ticket_id: number;
  order_id: number | null;
  buyer_clerk_id: string;
  seller_clerk_id: string;
  order_status: string | null;
  status: "open" | "closed";
  last_message: { message_content: string; sent_at: string } | null;
  message_count: number;
  is_direct?: boolean;
}

interface ChatWindow {
  userId: string;
  messages: Message[];
  unreadCount: number;
  avatar: string;
  name: string;
}

interface UseMessagesProps {
  orderId?: string | null;
  receiverId?: string | null;
  isDirect?: boolean;
}

export const useMessages = ({ orderId, receiverId, isDirect = false }: UseMessagesProps) => {
  const { userId, isLoaded, getToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);

  // Initialize WebSocket
  useEffect(() => {
    if (!isLoaded || !userId) return;
    if (socketRef.current) return; // Đã có socket thì không khởi tạo lại
    socketRef.current = io("http://localhost:8800", {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: { credentials: "include" },
    });
    socketRef.current.on("connect_error", (err: Error) => {
      setError("Không thể kết nối với server chat");
      console.error("Socket connection error:", err);
    });
    socketRef.current.on("newMessage", async (newMessage: Message) => {
      const msg = (newMessage && (newMessage as any).message) ? (newMessage as any).message : newMessage;
      if (!msg.id || !msg.sent_at) return;
      if (
        msg.sender_clerk_id === userId ||
        msg.receiver_clerk_id === userId
      ) {
        setMessages((prev) => {
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        const otherUserId = msg.sender_clerk_id === userId ? msg.receiver_clerk_id : msg.sender_clerk_id;
        let avatar = "/placeholder.svg";
        let name = "User";
        let needCreateWindow = false;
        setChatWindows((prev) => {
          const window = prev.find((w) => w.userId === otherUserId);
          if (window) {
            return prev.map((w) =>
              w.userId === otherUserId
                ? {
                    ...w,
                    messages: [...w.messages, msg],
                    unreadCount:
                      msg.sender_clerk_id !== userId && !msg.is_read
                        ? w.unreadCount + 1
                        : w.unreadCount,
                  }
                : w
            );
          } else {
            needCreateWindow = true;
            return prev;
          }
        });
        if (needCreateWindow) {
          // Nếu là seller, fetch avatar và name buyer
          if (userId === msg.receiver_clerk_id) {
            try {
              const token = await getToken();
              const userData = await import("@/lib/api").then(m => m.fetchUser(msg.sender_clerk_id, String(token)));
              avatar = userData.avatar || "/placeholder.svg";
              name = userData.name || userData.username || "User";
            } catch {}
          }
          setChatWindows((prev) => [
            ...prev,
            {
              userId: otherUserId,
              messages: [msg],
              unreadCount: msg.sender_clerk_id !== userId && !msg.is_read ? 1 : 0,
              avatar,
              name,
            },
          ]);
        }
        setTickets((prev) =>
          prev.map((t) =>
            t.order_id === msg.order_id && t.order_id !== undefined && msg.order_id !== null
              ? {
                  ...t,
                  last_message: {
                    message_content: msg.message_content,
                    sent_at: msg.sent_at,
                  },
                  message_count: (t.message_count || 0) + 1,
                }
              : t
          )
        );
      }
    });

    socketRef.current.on("messagesRead", ({ messageIds }: { messageIds: number[] }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m.id) ? { ...m, is_read: true } : m
        )
      );
      setChatWindows((prev) =>
        prev.map((w) => ({ ...w, unreadCount: 0 }))
      );
    });

    return () => {
      socketRef.current?.off("newMessage");
      socketRef.current?.off("messagesRead");
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [isLoaded, userId]);

  // Fetch tickets và direct messages
  const fetchTicketsData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Token is missing");

      // Fetch order tickets
      const orderTicketsData = await fetchTickets(userId, token);
      
      // Fetch direct messages
      const directMessagesData = await fetchDirectMessages(userId, "", token);

      if (orderTicketsData.success && directMessagesData.success) {
        // Transform direct messages thành tickets
        const directTickets = directMessagesData.messages.reduce((acc: Ticket[], msg: Message) => {
          const otherUserId = msg.sender_clerk_id === userId ? msg.receiver_clerk_id : msg.sender_clerk_id;
          const existingTicket = acc.find(t => 
            (t.buyer_clerk_id === otherUserId || t.seller_clerk_id === otherUserId) && t.is_direct
          );

          if (existingTicket) {
            existingTicket.message_count++;
            if (!existingTicket.last_message || new Date(msg.sent_at) > new Date(existingTicket.last_message.sent_at)) {
              existingTicket.last_message = {
                message_content: msg.message_content,
                sent_at: msg.sent_at
              };
            }
          } else {
            acc.push({
              ticket_id: msg.id,
              order_id: null,
              buyer_clerk_id: msg.sender_clerk_id === userId ? msg.receiver_clerk_id : msg.sender_clerk_id,
              seller_clerk_id: msg.sender_clerk_id === userId ? msg.sender_clerk_id : msg.receiver_clerk_id,
              order_status: null,
              status: "open",
              last_message: {
                message_content: msg.message_content,
                sent_at: msg.sent_at
              },
              message_count: 1,
              is_direct: true
            });
          }
          return acc;
        }, []);

        // Combine order tickets và direct tickets
        setTickets([
          ...(orderTicketsData.tickets || []),
          ...directTickets
        ]);
      } else {
        setError("Không thể tải danh sách tin nhắn");
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
      setError("Lỗi kết nối mạng hoặc server không phản hồi");
    } finally {
      setLoading(false);
    }
  }, [userId, getToken]);

  // Fetch messages
  const fetchMessagesData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Token is missing");
      let data;
      
      if (isDirect) {
        if (!receiverId) {
          // Nếu không có receiverId, fetch tất cả direct messages
          data = await fetchDirectMessages(userId, "", token);
        } else {
          // Nếu có receiverId, fetch direct messages với người nhận cụ thể
          data = await fetchDirectMessages(userId, receiverId, token);
        }
      } else {
        if (!orderId) return;
        data = await fetchMessages(orderId, token);
      }

      if (data.success) {
        setMessages(data.messages || []);
      } else {
        setError(data.message || "Không thể tải tin nhắn");
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
      setError("Lỗi kết nối mạng hoặc server không phản hồi");
    } finally {
      setLoading(false);
    }
  }, [userId, orderId, receiverId, isDirect, getToken]);

  // Join rooms mỗi khi orderId, receiverId, isDirect thay đổi
  useEffect(() => {
    if (!socketRef.current || !userId) return;
    if (orderId) {
      socketRef.current.emit("joinOrder", { orderId });
    }
    if (receiverId && isDirect) {
      socketRef.current.emit("joinChat", { userId, sellerId: receiverId });
    }
  }, [userId, orderId, receiverId, isDirect]);

  // Fetch initial data
  useEffect(() => {
    if (isLoaded && userId && (orderId || receiverId)) {
      fetchMessagesData();
    }
  }, [isLoaded, userId, orderId, receiverId, fetchMessagesData]);

  // Fetch tickets
  useEffect(() => {
    if (isLoaded && userId) {
      fetchTicketsData();
    }
  }, [isLoaded, userId, fetchTicketsData]);

  // Debounce markMessagesAsRead để tránh emit liên tục
  const debounce = (fn: (...args: any[]) => void, delay: number) => {
    let timer: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  };

  // Send message
  const sendMessage = async (
    messageContent: string,
    senderId: string,
    receiverId: string,
    orderId?: string | null
  ) => {
    if (!socketRef.current) return { success: false, message: "Socket not connected" };
    try {
      const token = await getToken();
      if (!token) throw new Error("Token is missing");
      
      const messageData = {
        order_id: orderId || null,
        sender_clerk_id: senderId,
        receiver_clerk_id: receiverId,
        message_content: messageContent,
        sent_at: new Date().toISOString(),
        is_direct_message: !orderId // Đánh dấu là tin nhắn trực tiếp nếu không có order_id
      };

      return new Promise((resolve) => {
        socketRef.current!.emit("sendMessage", messageData, (response: any) => {
          // Nếu response.message là object lồng, lấy object con
          const msg = (response && response.message && response.message.message) ? response.message.message : response.message;
          if (response.success && msg && msg.id && msg.sent_at) {
            setMessages((prev) => {
              if (prev.some(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            setChatWindows((prev) =>
              prev.map((w) =>
                w.userId === receiverId
                  ? {
                      ...w,
                      messages: [...w.messages, msg],
                    }
                  : w
              )
            );
            resolve(response);
          } else {
            setError(response.message || "Không thể gửi tin nhắn");
            resolve(response);
          }
        });
      });
    } catch (err) {
      setError("Lỗi gửi tin nhắn");
      console.error("Send message error:", err);
      return { success: false, message: "Lỗi gửi tin nhắn" };
    }
  };

  // Mark messages as read
  const markMessagesAsRead = debounce((orderId?: string, receiverId?: string) => {
    if (!socketRef.current) return;
    // Chỉ emit nếu có tin nhắn chưa đọc
    let unread = false;
    if (orderId) {
      const orderIdNum = Number(orderId);
      unread = messages.some(m => !m.is_read && m.order_id === orderIdNum);
      if (unread) {
        socketRef.current.emit("viewChat", {
          orderId,
          userId,
        });
      }
    } else if (receiverId) {
      unread = messages.some(m => !m.is_read && (m.sender_clerk_id === receiverId || m.receiver_clerk_id === receiverId));
      if (unread) {
        socketRef.current.emit("viewChat", {
          receiverId,
          userId,
        });
      }
    }
  }, 400);

  return {
    messages,
    tickets,
    chatWindows,
    setChatWindows,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    fetchMessagesData,
    fetchTicketsData,
  };
};

