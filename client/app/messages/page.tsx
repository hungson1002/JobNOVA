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
  const [recipientInfo, setRecipientInfo] = useState<{ id: string; name: string; avatar: string; online?: boolean; username?: string }>({
    id: "",
    name: "User",
    avatar: "/placeholder.svg",
    online: true,
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const searchParams = useSearchParams();
  const [firstTicket, setFirstTicket] = useState<any>(null);
  const [showList, setShowList] = useState(true); // responsive: show/hide list

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
    // Ưu tiên direct nếu có ?seller trên URL
    const sellerParam = searchParams.get('seller');
    if (sellerParam && tickets.length > 0) {
      // Tìm direct ticket với seller này
      const directTicket = tickets.find(t => t.is_direct && (t.buyer_clerk_id === sellerParam || t.seller_clerk_id === sellerParam));
      if (directTicket) {
        setSelectedTicket(directTicket);
        setShowList(false);
        return;
      } else {
        // Nếu chưa có, tạo ticket tạm thời để chat trực tiếp
        const tempTicket = {
          ticket_id: `direct_${userId}_${sellerParam}`,
          order_id: null,
          buyer_clerk_id: userId,
          seller_clerk_id: sellerParam,
          order_status: null,
          status: 'open',
          last_message: null,
          message_count: 0,
          unread_count: 0,
          is_direct: true,
        };
        setSelectedTicket(tempTicket);
        setShowList(false);
        return;
      }
    }
    if (!selectedTicket && firstTicket) {
      setSelectedTicket(firstTicket);
    }
    // Nếu đã có selectedTicket thì không làm gì cả, kể cả tickets thay đổi
  }, [firstTicket, selectedTicket, searchParams, tickets, userId]);

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
          name: (user.lastname && user.firstname) ? `${user.lastname} ${user.firstname}` : (user.firstname || user.lastname || user.username || "User"),
          avatar: (user.avatar) ? (user.avatar) : ("/placeholder"),
          online: (user.online) ? (user.online) : (false),
          username: (user.username) ? (user.username) : (undefined)
        });
      } catch (err) {
        setRecipientInfo({ id: (recipientId), name: ("User"), avatar: ("/placeholder"), online: (false), username: (undefined) });
      }
    };
    fetchRecipient();
  }, [selectedTicket, (userId)]);

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

      <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border bg-white lg:flex-row relative">
        {/* MessageList responsive */}
        <div className={`h-full w-full md:w-auto md:block ${selectedTicket && !showList ? 'hidden' : 'block'} fixed md:static inset-0 z-30 bg-white md:bg-transparent transition-all duration-200`}>
          <MessageList
            tickets={tickets}
            selectedTicketId={selectedTicketId}
            onSelectTicket={(ticket) => {
              setSelectedTicket(ticket);
              setShowList(false); // ẩn list khi chọn hội thoại trên mobile
            }}
            userId={userId}
            setFirstTicket={setFirstTicket}
            messagesMap={messagesMap}
          />
        </div>
        {/* MessageThread responsive */}
        <div className={`flex flex-1 flex-col h-full min-h-0 overflow-y-auto ${selectedTicket ? 'block' : 'hidden'} md:block`}>
          {selectedTicket ? (
            <div className="relative h-full">
              {/* Nút back trên mobile */}
              <button
                className="md:hidden absolute top-2 left-2 z-40 bg-white rounded-full shadow p-2 border border-gray-200"
                onClick={() => setShowList(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <MessageThread
                messages={messages}
                recipient={recipientInfo}
                userId={userId}
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
            </div>
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
