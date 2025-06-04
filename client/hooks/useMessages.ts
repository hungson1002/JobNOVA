"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import io from "socket.io-client";
// import type { Socket } from "socket.io-client";
import { fetchMessages, fetchTickets, fetchDirectMessages } from "@/lib/api";

// Tạo socket messages ở module scope (singleton)
const messageSocket = io("http://localhost:8800");

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
  last_message: {
    message_content: string;
    sent_at: string;
    is_read?: boolean;
    receiver_clerk_id?: string;
    sender_clerk_id?: string;
    ticket_status?: string;
  } | null;
  message_count: number;
  unread_count?: number;
  is_direct?: boolean;
}

interface ChatWindow {
  userId: string;
  messages: Message[];
  unreadCount: number;
  avatar: string;
  name: string;
  minimized: boolean;
}

interface UseMessagesProps {
  orderId?: string | null;
  receiverId?: string | null;
  isDirect?: boolean;
}

export const useMessages = ({ orderId, receiverId, isDirect = false }: UseMessagesProps) => {
  const { userId, isLoaded, getToken } = useAuth();
  const [messagesMap, setMessagesMap] = useState<{ [key: string]: Message[] }>({});
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [chatWindows, setChatWindows] = useState<ChatWindow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const count = tickets.reduce((sum, t) => sum + (t.unread_count ?? 0), 0);
    setUnreadCount(count);
  }, [tickets]);

  // Join user room và lắng nghe event chỉ 1 lần
  useEffect(() => {
    if (!isLoaded || !userId) return;
    messageSocket.emit("joinUser", { userId });
    const handleNewMessage = (newMessage: Message) => {
      const msg = (newMessage && (newMessage as any).message) ? (newMessage as any).message : newMessage;
      if (!msg.id || !msg.sent_at) return;
      if (msg.sender_clerk_id === userId || msg.receiver_clerk_id === userId) {
        // Lấy id người đối diện
        const otherId = msg.sender_clerk_id === userId ? msg.receiver_clerk_id : msg.sender_clerk_id;
        const key = msg.is_direct_message ? `direct_${otherId}` : `order_${msg.order_id}`;
        setMessagesMap(prev => {
          const exists = (prev[key] || []).some(m => m.id === msg.id);
          if (exists) return prev;
          return {
            ...prev,
            [key]: [...(prev[key] || []), msg]
          };
        });
        setTickets((prev) => {
          return prev.map((t) => {
            if (
              (msg.order_id && t.order_id === Number(msg.order_id)) ||
              (!msg.order_id && t.is_direct && (t.buyer_clerk_id === msg.sender_clerk_id || t.seller_clerk_id === msg.sender_clerk_id))
            ) {
              if (t.last_message && (t.last_message as any).id === msg.id) return t;
              const isSender = msg.sender_clerk_id === userId;
              return {
                ...t,
                last_message: {
                  message_content: msg.message_content,
                  sent_at: msg.sent_at,
                  is_read: isSender ? true : msg.is_read,
                  receiver_clerk_id: msg.receiver_clerk_id,
                  sender_clerk_id: msg.sender_clerk_id,
                  id: msg.id,
                },
                unread_count: isSender ? 0 : (msg.receiver_clerk_id === userId && !msg.is_read ? (t.unread_count || 0) + 1 : t.unread_count),
                message_count: (t.message_count || 0) + 1,
              };
            }
            return t;
          });
        });
      }
    };
    const handleMessagesRead = (data: { orderId?: string; receiverId?: string; messageIds: number[]; userId?: string }) => {
      const { orderId, receiverId, messageIds, userId: readUserId } = data;
      if (readUserId && readUserId !== userId) return; // Chỉ update nếu là user mình
      setMessagesMap(prev => ({
        ...prev,
        [`${orderId ? `order_${orderId}` : receiverId ? `direct_${receiverId}` : ''}`]:
          (prev[`${orderId ? `order_${orderId}` : receiverId ? `direct_${receiverId}` : ''}`] || []).map((m) =>
            messageIds.includes(m.id) ? { ...m, is_read: true } : m
          )
      }));
      setTickets((prev) => {
        const updated = prev.map((t) => {
          if (orderId && t.order_id === Number(orderId)) {
            return { ...t, unread_count: 0 };
          }
          if (
            receiverId &&
            t.is_direct &&
            (t.buyer_clerk_id === receiverId || t.seller_clerk_id === receiverId)
          ) {
            return { ...t, unread_count: 0 };
          }
          return t;
        });
        return [...updated];
      });
    };
    messageSocket.on("newMessage", handleNewMessage);
    messageSocket.on("messagesRead", handleMessagesRead);
    return () => {
      messageSocket.off("newMessage", handleNewMessage);
      messageSocket.off("messagesRead", handleMessagesRead);
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
                sent_at: msg.sent_at,
                is_read: msg.is_read,
                receiver_clerk_id: msg.receiver_clerk_id,
                sender_clerk_id: msg.sender_clerk_id,
              };
            }
            if (msg.receiver_clerk_id === userId && !msg.is_read) {
              existingTicket.unread_count = (existingTicket.unread_count || 0) + 1;
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
                sent_at: msg.sent_at,
                is_read: msg.is_read,
                receiver_clerk_id: msg.receiver_clerk_id,
                sender_clerk_id: msg.sender_clerk_id,
              },
              message_count: 1,
              unread_count: msg.receiver_clerk_id === userId && !msg.is_read ? 1 : 0,
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
  const fetchMessagesData = useCallback(async (orderIdParam?: string, receiverIdParam?: string) => {
    if (!userId) return [];
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Token is missing");
      let data;
      let msgs: Message[] = [];
      let key = "";
      if (isDirect || receiverIdParam) {
        if (!receiverIdParam) {
          data = await fetchDirectMessages(userId, "", token);
        } else {
          data = await fetchDirectMessages(userId, receiverIdParam, token);
        }
        key = `direct_${receiverIdParam || receiverId}`;
      } else {
        if (!orderIdParam) return [];
        data = await fetchMessages(orderIdParam, token);
        key = `order_${orderIdParam}`;
      }
      if (data.success) {
        msgs = data.messages || [];
        setMessagesMap(prev => ({ ...prev, [key]: msgs }));
        return msgs;
      } else {
        setError(data.message || "Không thể tải tin nhắn");
        return [];
      }
    } catch (err) {
      console.error("Fetch messages error:", err);
      setError("Lỗi kết nối mạng hoặc server không phản hồi");
      return [];
    } finally {
      setLoading(false);
    }
  }, [userId, isDirect, getToken, receiverId]);

  // Join rooms mỗi khi orderId, receiverId, isDirect thay đổi
  useEffect(() => {
    if (!messageSocket || !userId) return;
    if (orderId) {
      messageSocket.emit("joinOrder", { orderId });
    }
    if (receiverId && isDirect) {
      // Join direct room theo chuẩn server: direct_{userId}_{receiverId} (sort)
      const room = `direct_${[userId, receiverId].sort().join("_")}`;
      messageSocket.emit("joinDirect", { room });
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
    if (!messageSocket) return { success: false, message: "Socket not connected" };
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
        messageSocket.emit("sendMessage", messageData, (response: any) => {
          if (!response.success) {
            setError(response.message || "Không thể gửi tin nhắn");
          } else {
            // Cập nhật messagesMap ngay cho sender
            const msg = response.message && response.message.message ? response.message.message : response.message;
            if (msg) {
              const otherId = msg.sender_clerk_id === userId ? msg.receiver_clerk_id : msg.sender_clerk_id;
              const key = msg.is_direct_message ? `direct_${otherId}` : `order_${msg.order_id}`;
              setMessagesMap(prev => {
                const exists = (prev[key] || []).some(m => m.id === msg.id);
                if (exists) return prev;
                return {
                  ...prev,
                  [key]: [...(prev[key] || []), msg]
                };
              });
            }
          }
          resolve(response);
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
    if (!messageSocket) return;
    if (orderId) {
      const orderIdNum = Number(orderId);
      // Luôn set unread_count về 0 khi gọi, không cần kiểm tra unread
      setTickets(prev => prev.map(t => t.order_id === orderIdNum ? { ...t, unread_count: 0 } : t));
      messageSocket.emit("viewChat", { orderId, userId });
    } else if (receiverId) {
      setTickets(prev => prev.map(t => (t.is_direct && (t.buyer_clerk_id === receiverId || t.seller_clerk_id === receiverId)) ? { ...t, unread_count: 0 } : t));
      messageSocket.emit("viewChat", { receiverId, userId });
    }
  }, 400);

  return {
    messages: [],
    messagesMap,
    tickets,
    chatWindows,
    setChatWindows,
    loading,
    error,
    sendMessage,
    markMessagesAsRead,
    fetchMessagesData,
    fetchTicketsData,
    unreadCount,
    setTickets,
  };
};

