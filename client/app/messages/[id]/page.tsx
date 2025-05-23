"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { MessageThread } from "@/components/message/messageThread";
import { useMessages } from "@/hooks/useMessages";
import { fetchUser, fetchTickets } from "@/lib/api";

export default function MessageDetailPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : "";
  const [isDirect, setIsDirect] = useState(false);
  const { messages, sendMessage, markMessagesAsRead, loading, error } = useMessages({ 
    orderId: isDirect ? null : id,
    receiverId: isDirect ? id : null,
    isDirect
  });
  const [recipient, setRecipient] = useState<{ id: string; name: string; avatar: string; online?: boolean }>({
    id: "",
    name: "User",
    avatar: "/placeholder.svg",
    online: false,
  });

  useEffect(() => {
    if (!isLoaded || !userId || !id || typeof id !== "string") return;

    let cancelled = false;

    const fetchRecipientInfo = async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;

        // Kiểm tra xem id có phải là order_id hay không
        const ticketsData = await fetchTickets(userId, token);
        if (cancelled) return;
        const ticket = ticketsData.tickets?.find((t: any) => t.order_id === id);
        if (ticket) {
          // Nếu là order message
          setIsDirect(false);
          const recipientId = ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id;
          const userData = await fetchUser(String(recipientId), token);
          if (cancelled) return;
          setRecipient({
            id: recipientId,
            name: userData.name || "User",
            avatar: userData.avatar || "/placeholder.svg",
            online: userData.online || false,
          });
          // Chỉ gọi markMessagesAsRead với orderId khi là order message
          markMessagesAsRead(id, undefined);
        } else {
          // Nếu là direct message
          setIsDirect(true);
          const userData = await fetchUser(String(id), token);
          if (cancelled) return;
          setRecipient({
            id: id,
            name: userData.name || "User",
            avatar: userData.avatar || "/placeholder.svg",
            online: userData.online || false,
          });
          // Chỉ gọi markMessagesAsRead với receiverId khi là direct message
          markMessagesAsRead(undefined, id);
        }
      } catch (err) {
        console.error("Fetch recipient error:", err);
        // Nếu không tìm thấy order, coi như là direct message
        setIsDirect(true);
        try {
          const token = await getToken();
          if (!token || cancelled) return;
          const userData = await fetchUser(String(id), token);
          if (cancelled) return;
          setRecipient({
            id: id,
            name: userData.name || "User",
            avatar: userData.avatar || "/placeholder.svg",
            online: userData.online || false,
          });
          markMessagesAsRead(undefined, id);
        } catch (err) {
          console.error("Fetch user error:", err);
        }
      }
    };

    fetchRecipientInfo();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, userId, id, getToken, markMessagesAsRead, isDirect]);

  const handleSendMessage = async (content: string) => {
    if (!userId || !recipient.id) return;
    await sendMessage(content, userId, recipient.id, isDirect ? null : id);
  };

  if (!isLoaded || !userId) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {isDirect ? `Chat with ${recipient.name}` : `Order #${id}`}
      </h1>
      {loading && <div className="text-gray-500 text-sm mb-4">Loading...</div>}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      <MessageThread
        messages={messages}
        recipient={recipient}
        onSendMessage={handleSendMessage}
      />
    </main>
  );
}
