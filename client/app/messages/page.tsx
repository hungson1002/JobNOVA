"use client";

import { useState, useEffect, memo, useMemo, useRef } from "react";
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
  const [initialLoading, setInitialLoading] = useState(true);
  const searchParams = useSearchParams();
  const [firstTicket, setFirstTicket] = useState<any>(null);

  const messageParams = useMemo(() => {
    if (!selectedTicket || !userId) return null;
    // Xác định id người đối diện (otherId)
    let otherId = null;
    if (selectedTicket.is_direct) {
      otherId = selectedTicket.buyer_clerk_id === userId
        ? selectedTicket.seller_clerk_id
        : selectedTicket.buyer_clerk_id;
    }
    return {
      orderId: selectedTicket.order_id ?? null,
      receiverId: otherId,
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
    setTickets,
  } = useMessages(messageParams || {});

  // Xác định key của hội thoại hiện tại giống hệt logic trong handleNewMessage
  const key = messageParams
    ? messageParams.isDirect && messageParams.receiverId
      ? `direct_${messageParams.receiverId}`
      : messageParams.orderId
      ? `order_${messageParams.orderId}`
      : ""
    : "";

  const messages = messagesMap[key] || [];

  useEffect(() => {
    if (!selectedTicket && firstTicket) {
      setSelectedTicket(firstTicket);
    }
    // Nếu đã có selectedTicket thì không làm gì cả, kể cả tickets thay đổi
  }, [firstTicket, selectedTicket, searchParams]);

  useEffect(() => {
    if (!loading) {
      setInitialLoading(false);
    }
  }, [loading]);

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
          setFirstTicket={setFirstTicket}
        />
        <div className="flex flex-1 flex-col h-full min-h-0 overflow-y-auto">
          {selectedTicket ? (
            <MessageThread
              messages={messages}
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
