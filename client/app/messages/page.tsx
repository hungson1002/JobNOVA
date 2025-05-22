"use client"

import { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@clerk/nextjs";
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Search } from "lucide-react"
import io from "socket.io-client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Ticket {
  order_id: string
  buyer_clerk_id: string
  seller_clerk_id: string
  order_status: string
  status: string
  last_message: { message_content: string; sent_at: string }
  message_count: number
}

interface Conversation {
  id: string
  name: string
  avatar: string
  lastMessage: string
  time: string
  online: boolean
  unread: boolean
  unreadCount: number
  orderId?: string
  orderTitle?: string
}

interface Messages {
  id: string
  order_id: string
  sender_clerk_id: string
  receiver_clerk_id: string
  message_content: string
  sent_at: string
  is_read: boolean
}

// Define the structure of the API response for fetching tickets
interface TicketsApiResponse {
  success: boolean
  tickets?: Ticket[]
  message?: string // Error message when success is false
}

export default function MessagesPage({ searchParams }: { searchParams: { order?: string } }) {
  const searchParamsHook = useSearchParams()
  const orderId = searchParamsHook.get("order") || null
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false) // <-- Add loading state
  // const { user } = useUser()
  const { userId, isLoaded, getToken } = useAuth(); // Sử dụng useAuth thay vì useUser
  //nêu userId là id của người dùng đang đăng nhập
  const senderId = userId || null // Lấy senderId từ userId
  
  const socket = io("http://localhost:8800", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: {
      credentials: "include"
    }
  })

  useEffect(() => {
    if (!isLoaded) return;

    const fetchTickets = async () => {
      setLoading(true);
      setError("");
      try {
        const token = await getToken();
        const response = await fetch(`http://localhost:8800/api/messages/tickets?clerk_id=${senderId}`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: TicketsApiResponse = await response.json();
        if (data.success) {
          setTickets(data.tickets || []);
        } else {
          setError(data.message || "Không thể tải danh sách ticket");
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(`Connecting error: ${err.message}`);
        } else {
          setError("Undefined connecting error");
        }
        console.error("Fetch tickets error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (senderId) fetchTickets();
  }, [senderId, isLoaded]);

  // Check if the user is loaded and signed in
  useEffect(() => {
    if (!senderId) {
      setError("Người dùng chưa đăng nhập")
      return
    }

    const fetchTickets = async () => {
      try {
        const response = await fetch(`http://localhost:8800/api/messages/tickets?clerk_id=${senderId}`, {
          credentials: "include",
        })
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data: TicketsApiResponse = await response.json()
        if (data.success) {
          setTickets(data.tickets || [])
        } else {
          setError(data.message || "Không thể tải danh sách ticket")
        }
      } catch (err) {
        setError("Lỗi kết nối mạng hoặc server không phản hồi")
        console.error("Fetch tickets error:", err)
      }
    }
    fetchTickets()

    socket.on("connect_error", (err: Error) => {
      console.error("Socket connection error:", err)
      setError("Không thể kết nối với server chat")
    })

    socket.on("newMessage", (newMessage: Messages) => {
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.order_id === newMessage.order_id
            ? {
                ...ticket,
                last_message: { message_content: newMessage.message_content, sent_at: newMessage.sent_at },
                message_count: ticket.message_count + 1,
              }
            : ticket
        )
      )
    })

    return () => {
      socket.off("newMessage")
      socket.off("connect_error")
    }
  }, [senderId])

  useEffect(() => {
    if (orderId) {
      const orderTicket = tickets.find((t) => t.order_id === orderId)
      if (orderTicket) {
        setSelectedConversation({
          id: orderTicket.order_id,
          name: "User",
          avatar: "/placeholder.svg?height=40&width=40",
          lastMessage: orderTicket.last_message?.message_content || "",
          time: orderTicket.last_message?.sent_at || "",
          online: false,
          unread: orderTicket.message_count > 0,
          unreadCount: orderTicket.message_count,
          orderId: orderTicket.order_id,
          orderTitle: "Order",
        })
      }
    } else if (tickets.length > 0 && !selectedConversation) {
      const firstTicket = tickets[0]
      setSelectedConversation({
        id: firstTicket.order_id,
        name: "User",
        avatar: "/placeholder.svg?height=40&width=40",
        lastMessage: firstTicket.last_message?.message_content || "",
        time: firstTicket.last_message?.sent_at || "",
        online: false,
        unread: firstTicket.message_count > 0,
        unreadCount: firstTicket.message_count,
        orderId: firstTicket.order_id,
        orderTitle: "Order",
      })
    }
  }, [orderId, tickets])

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? "" : date.toLocaleTimeString()
  }

  const conversationItems = useMemo(() => {
    return tickets.map((ticket) => ({
      id: ticket.order_id,
      name: "User",
      avatar: "/placeholder.svg?height=40&width=40",
      lastMessage: ticket.last_message?.message_content || "",
      time: ticket.last_message?.sent_at ? formatDate(ticket.last_message.sent_at) : "",
      online: false,
      unread: ticket.message_count > 0,
      unreadCount: ticket.message_count,
      orderId: ticket.order_id,
      orderTitle: "Order",
    }))
  }, [tickets])

  const unreadConversations = useMemo(() => {
    return conversationItems.filter((conv) => conv.unread)
  }, [conversationItems])

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="sm" className="mr-4" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Messages</h1>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <svg className="animate-spin h-5 w-5 text-gray-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading...
        </div>
      )}

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      {!loading && !error && tickets.length === 0 && (
        <div className="text-gray-500 text-sm mb-4">No messages to display.</div>
      )}

      <div className="flex h-[calc(100vh-200px)] flex-col overflow-hidden rounded-lg border bg-white lg:flex-row">
        <div className="w-full border-r lg:w-80">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" placeholder="Search messages" />
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
            <div className="h-[calc(100vh-300px)] overflow-y-auto">
              <TabsContent value="all" className="m-0">
                {conversationItems.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedConversation?.orderId === conv.orderId}
                    onClick={() => setSelectedConversation(conv)}
                  />
                ))}
              </TabsContent>
              <TabsContent value="unread" className="m-0">
                {unreadConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedConversation?.orderId === conv.orderId}
                    onClick={() => setSelectedConversation(conv)}
                  />
                ))}
              </TabsContent>
              <TabsContent value="archived" className="m-0">
                <div className="flex h-40 items-center justify-center text-center text-gray-500">
                  <p>No archived conversations</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex flex-1 flex-col">
          {selectedConversation ? (
            <Link href={`/messages/${selectedConversation.orderId}`}>
              <Button variant="outline" className="m-4">
                View Conversation
              </Button>
            </Link>
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
                Select a conversation from the list to start chatting or search for a specific
                message.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function ConversationItem({ conversation, isSelected, onClick }: { conversation: Conversation; isSelected: boolean; onClick: () => void }) {
  return (
    <div
      className={`flex cursor-pointer items-start gap-3 border-b p-3 hover:bg-gray-50 ${
        isSelected ? "bg-gray-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="relative">
        <Image
          src={conversation.avatar || "/placeholder.svg"}
          alt={conversation.name}
          width={40}
          height={40}
          className="rounded-full"
        />
        {conversation.online && (
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500"></span>
        )}
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{conversation.name}</h3>
          <span className="text-xs text-gray-500">{conversation.time}</span>
        </div>
        <p className="truncate text-sm text-gray-600">{conversation.lastMessage}</p>
        {conversation.orderId && (
          <div className="mt-1">
            <Badge variant="outline" className="text-xs">
              Order #{conversation.orderId}
            </Badge>
          </div>
        )}
      </div>
      {conversation.unread && (
        <Badge className="h-5 w-5 rounded-full bg-emerald-500 p-0 text-center">
          {conversation.unreadCount}
        </Badge>
      )}
    </div>
  )
}

function useUser() {
 //mock receiver_clerk_id thực tế
  const user = {
    id: "user_clerk_id",
    name: "User Name",
    avatar: "/placeholder.svg",
    country: "Country",
  }
  return { user }

}