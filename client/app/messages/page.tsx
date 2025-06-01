"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageList } from "@/components/message/messageList";
import { useMessages } from "@/hooks/useMessages";
import { MessageThread } from "@/components/message/messageThread";

export default function MessagesPage() {
  const { userId, isLoaded } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const { tickets, loading, error, sendMessage, fetchMessagesData, messages } = useMessages({
    orderId: selectedTicket?.order_id ? String(selectedTicket.order_id) : undefined,
    receiverId: selectedTicket?.is_direct
      ? (selectedTicket?.buyer_clerk_id === userId
          ? selectedTicket?.seller_clerk_id
          : selectedTicket?.buyer_clerk_id)
      : undefined,
    isDirect: selectedTicket?.is_direct || false,
  });

  useEffect(() => {
    if (tickets.length > 0 && !selectedTicket) {
      setSelectedTicket(tickets[0]);
    }
  }, [tickets]);

  if (!isLoaded || !userId) {
    return <div>Loading...</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8 h-screen flex flex-col">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="sm" className="mr-4" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      {loading && <div className="text-gray-500 text-sm mb-4">Loading...</div>}
      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
      {!loading && !error && tickets.length === 0 && (
        <div className="text-gray-500 text-sm mb-4">No messages to display.</div>
      )}

      <div className="flex flex-1 min-h-0 overflow-hidden rounded-lg border bg-white lg:flex-row">
        <MessageList
          tickets={tickets}
          selectedTicketId={selectedTicket?.is_direct ? (selectedTicket?.buyer_clerk_id === userId ? selectedTicket?.seller_clerk_id : selectedTicket?.buyer_clerk_id) : selectedTicket?.order_id}
          onSelectTicket={setSelectedTicket}
          userId={userId}
        />
        <div className="flex flex-1 flex-col h-full min-h-0">
          {selectedTicket ? (
            <MessageThread
              messages={messages}
              recipient={{
                id: selectedTicket.is_direct
                  ? (selectedTicket.buyer_clerk_id === userId
                      ? selectedTicket.seller_clerk_id
                      : selectedTicket.buyer_clerk_id)
                  : (selectedTicket.buyer_clerk_id === userId
                      ? selectedTicket.seller_clerk_id
                      : selectedTicket.buyer_clerk_id),
                name: selectedTicket.is_direct
                  ? "User"
                  : `Order #${selectedTicket.order_id}`,
                avatar: "/placeholder.svg",
                online: true,
              }}
              onSendMessage={async (content) => {
                if (!selectedTicket) return;
                const receiverId = selectedTicket.is_direct
                  ? (selectedTicket.buyer_clerk_id === userId
                      ? selectedTicket.seller_clerk_id
                      : selectedTicket.buyer_clerk_id)
                  : selectedTicket.seller_clerk_id;
                await sendMessage(
                  content,
                  userId,
                  receiverId,
                  selectedTicket.order_id ? String(selectedTicket.order_id) : undefined
                );
                fetchMessagesData();
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