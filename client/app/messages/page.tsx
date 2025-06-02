"use client";

import { useState, useEffect, memo, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import { fetchUser } from "@/lib/api";
import { useMessages, Message } from "@/hooks/useMessages";
import MessageThread from "@/components/message/messageThread";
import { MessageList } from "@/components/message/messageList";
import { useSearchParams } from "next/navigation";

function MessagesPage() {
  const { userId, isLoaded } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [recipientInfo, setRecipientInfo] = useState<{ id: string; name: string; avatar: string; online?: boolean }>({
    id: "",
    name: "User",
    avatar: "/placeholder.svg",
    online: true,
  });
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const searchParams = useSearchParams();

const messageParams = useMemo(() => {
  if (!selectedTicket || !userId) return null;
  return {
    orderId: selectedTicket.order_id ?? null,
    receiverId: selectedTicket.is_direct
      ? (selectedTicket.buyer_clerk_id === userId
          ? selectedTicket.seller_clerk_id
          : selectedTicket.buyer_clerk_id)
      : undefined,
    isDirect: selectedTicket.is_direct ?? false,
  };
}, [selectedTicket, userId]);

const {
  tickets,
  messagesMap,
  loading,
  error,
  sendMessage,
  fetchMessagesData,
  fetchTicketsData,
  markMessagesAsRead,
} = useMessages(messageParams || {});

useEffect(() => {
  const type = searchParams.get("type");
  const id = searchParams.get("id");

  if (tickets.length > 0) {
    let foundTicket = null;
    if (type === "direct") {
      foundTicket = tickets.find(t => {
        const otherUser = t.buyer_clerk_id === userId ? t.seller_clerk_id : t.buyer_clerk_id;
        return otherUser === id;
      });
    } else if (type === "order") {
      foundTicket = tickets.find(t => String(t.order_id) === id);
    }

    if (foundTicket) {
      setSelectedTicket(foundTicket);
    } else if (!selectedTicket) {
      setSelectedTicket(tickets[0]);
    }
  }
}, [tickets, userId]);

  useEffect(() => {
    if (!loading) {
      setInitialLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicket) {
      setSelectedTicket(tickets[0]);
      const t = tickets[0];
      if (t && userId) {
        const isDirect = t.is_direct;
        const receiverId = isDirect
          ? t.buyer_clerk_id === userId
            ? t.seller_clerk_id
            : t.buyer_clerk_id
          : null;
        let key = isDirect && receiverId ? `direct_${receiverId}` : `order_${t.order_id}`;
        if (!messagesMap[key]) {
          if (isDirect && receiverId) fetchMessagesData(undefined, receiverId);
          else fetchMessagesData(String(t.order_id), undefined);
        }
      }
    }
  }, [tickets, selectedTicket, userId]);

  useEffect(() => {
    const fetchRecipient = async () => {
      if (!selectedTicket || !userId) return;
      const isDirect = selectedTicket.is_direct;
      const recipientId = isDirect
        ? (selectedTicket.buyer_clerk_id === userId ? selectedTicket.seller_clerk_id : selectedTicket.buyer_clerk_id)
        : (selectedTicket.buyer_clerk_id === userId ? selectedTicket.seller_clerk_id : selectedTicket.buyer_clerk_id);
      try {
        const user = await fetchUser(recipientId, "");
        setRecipientInfo({
          id: recipientId,
          name: user.lastname && user.firstname
            ? `${user.lastname} ${user.firstname}`
            : user.firstname || user.lastname || user.username || "User",
          avatar: user.avatar || "/placeholder.svg",
          online: true,
        });
      } catch {
        setRecipientInfo({ id: recipientId, name: "User", avatar: "/placeholder.svg", online: true });
      }
    };
    fetchRecipient();
  }, [selectedTicket, userId]);

  // Mỗi lần đổi hội thoại, luôn fetch lại messages cho hội thoại đó
  useEffect(() => {
    if (!selectedTicket || !userId) return;
    const fetchMsgs = async () => {
      if (selectedTicket.order_id) {
        // Ưu tiên fetch theo order_id nếu có
        console.log("DEBUG fetch order:", { userId, orderId: selectedTicket.order_id, selectedTicket });
        const msgs = await fetchMessagesData(String(selectedTicket.order_id), undefined);
        console.log("DEBUG order response:", msgs);
        setSelectedMessages(msgs);
      } else if (selectedTicket.is_direct) {
        // Nếu không có order_id, fetch direct
        const receiverId = selectedTicket.buyer_clerk_id === userId
          ? selectedTicket.seller_clerk_id
          : selectedTicket.buyer_clerk_id;
        if (!receiverId || receiverId === userId) {
          setSelectedMessages([]);
          return;
        }
        console.log("DEBUG fetch direct:", { userId, receiverId, selectedTicket });
        const msgs = await fetchMessagesData(undefined, receiverId);
        console.log("DEBUG direct response:", msgs);
        setSelectedMessages(msgs);
      } else {
        setSelectedMessages([]);
      }
    };
    fetchMsgs();
  }, [selectedTicket, userId, fetchMessagesData]);

  const selectedTicketId = useMemo(() => {
    if (!selectedTicket) return null;
    return selectedTicket.is_direct
      ? selectedTicket.buyer_clerk_id === userId
        ? selectedTicket.seller_clerk_id
        : selectedTicket.buyer_clerk_id
      : selectedTicket.order_id;
  }, [selectedTicket, userId]);

  if (typeof window === "undefined" || !isLoaded || !userId) return null;

  return (
    <main className="container mx-auto px-0 h-[calc(100vh-64px)] flex flex-col">
      {initialLoading && loading && (
        <div className="text-gray-500 text-sm mb-4">Loading...</div>
      )}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      {!loading && !error && tickets.length === 0 && (
        <div className="text-gray-500 text-sm mb-4">No messages to display.</div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border bg-white lg:flex-row">
        <MessageList
          tickets={tickets}
          selectedTicketId={selectedTicketId}
          onSelectTicket={setSelectedTicket}
          userId={userId}
        />
        <div className="flex flex-1 flex-col h-full min-h-0 overflow-y-auto">
          {selectedTicket ? (
            <MessageThread
              messages={selectedMessages}
              recipient={recipientInfo}
              onSendMessage={async (content) => {
                const receiverId = selectedTicket.is_direct
                  ? selectedTicket.buyer_clerk_id === userId
                    ? selectedTicket.seller_clerk_id
                    : selectedTicket.buyer_clerk_id
                  : selectedTicket.seller_clerk_id;
                await sendMessage(
                  content,
                  userId,
                  receiverId,
                  selectedTicket.order_id ? String(selectedTicket.order_id) : undefined
                );
              }}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-gray-400"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Your Messages</h3>
              <p className="max-w-md text-gray-500">
                Select a conversation from the list to start chatting or search for a specific message.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default memo(MessagesPage);
