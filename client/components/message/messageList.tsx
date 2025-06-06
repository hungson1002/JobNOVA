import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket as OriginalTicket } from "@/hooks/useMessages";
import { useEffect, useState, useRef } from "react";
import { fetchUser } from "@/lib/api";
import { useMessages } from "@/hooks/useMessages";
import io from "socket.io-client";

type Message = {
  message_content: string;
  sent_at: string;
  is_read?: boolean;
};

type Ticket = Omit<OriginalTicket, "last_message"> & {
  last_message?: Message;
};

interface MessageListProps {
    tickets: (Omit<Ticket, "last_message"> & { last_message?: Message | null })[];
  selectedTicketId: string | null;
  onSelectTicket: (ticket: Ticket) => void;
  userId: string;
  setFirstTicket?: (ticket: Ticket | null) => void;
  messagesMap: Record<string, Message[]>;
}

interface UserInfo {
  name: string;
  avatar: string;
  lastname?: string;
  firstname?: string;
  username?: string;
}

const socket = io("http://localhost:8800");

export function MessageList({ tickets, selectedTicketId, onSelectTicket, userId, setFirstTicket, messagesMap }: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfoMap, setUserInfoMap] = useState<Record<string, UserInfo & { online?: boolean }>>({});
  const { markMessagesAsRead } = useMessages({});
  const [tabValue, setTabValue] = useState("all");
  const tabsRef = useRef<any>(null);

  useEffect(() => {
    // Fetch avatar và tên cho tất cả user liên quan đến ticket
    const fetchAll = async () => {
      const uniqueUserIds = Array.from(new Set(tickets.map(t => {
        // Nếu là direct message (không có order_id), lấy buyer_clerk_id hoặc seller_clerk_id
        if (!t.order_id) return t.buyer_clerk_id || t.seller_clerk_id;
        // Nếu là order, lấy buyer_clerk_id hoặc seller_clerk_id (ưu tiên buyer)
        return t.buyer_clerk_id || t.seller_clerk_id;
      })));
      for (const clerkId of uniqueUserIds) {
        if (clerkId && !userInfoMap[clerkId]) {
          try {
            const userData = await fetchUser(clerkId, "");
            setUserInfoMap(prev => ({
              ...prev,
              [clerkId]: {
                ...prev[clerkId],
                name: userData.name || userData.username || "User",
                avatar: userData.avatar || "/placeholder.svg",
                lastname: userData.lastname,
                firstname: userData.firstname,
                username: userData.username,
              },
            }));
          } catch {}
        }
      }
    };
    fetchAll();
  }, [tickets]);

  // Realtime online status for all users in tickets
  useEffect(() => {
    const userIds = Array.from(new Set([
      ...tickets.flatMap(t => [t.buyer_clerk_id, t.seller_clerk_id]),
      userId // Đảm bảo luôn check online cho chính mình
    ]));
    function handleOnline({ userId }: { userId: string }) {
      setUserInfoMap(prev => ({ ...prev, [userId]: { ...(prev[userId] || {}), online: true } }));
    }
    function handleOffline({ userId }: { userId: string }) {
      setUserInfoMap(prev => ({ ...prev, [userId]: { ...(prev[userId] || {}), online: false } }));
    }
    socket.on("userOnline", handleOnline);
    socket.on("userOffline", handleOffline);
    // Check online for all users on mount
    userIds.forEach(id => {
      if (id) socket.emit("checkOnline", { userId: id }, (isOnline: boolean) => {
        setUserInfoMap(prev => ({ ...prev, [id]: { ...(prev[id] || {}), online: isOnline } }));
      });
    });
    return () => {
      socket.off("userOnline", handleOnline);
      socket.off("userOffline", handleOffline);
    };
  }, [tickets]);

  const filteredTickets = tickets.filter((ticket) =>
    ticket.last_message?.message_content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Loại bỏ ticket trùng key (chỉ dựa vào direct_${otherUserId} hoặc order_${ticket.order_id})
  const seenKeys = new Set();
  const uniqueTickets = filteredTickets.filter(ticket => {
    const isDirect = ticket.is_direct || !ticket.order_id;
    const otherUserId = isDirect
      ? (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id)
      : (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id);
    const key = isDirect
      ? `direct_${otherUserId}`
      : `order_${ticket.order_id}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // Helper lấy last message đúng cặp user (đặt trước khi dùng trong sort)
  const getLastMessage = (otherUserId: string, orderId?: string | number | null) => {
    let key = orderId ? `order_${String(orderId)}` : `direct_${otherUserId}`;
    const messages = messagesMap && messagesMap[key] ? messagesMap[key] : [];
    const filtered = messages.filter(
      (msg: any) =>
        (msg.sender_clerk_id === userId && msg.receiver_clerk_id === otherUserId) ||
        (msg.sender_clerk_id === otherUserId && msg.receiver_clerk_id === userId)
    );
    return filtered.length > 0 ? filtered[filtered.length - 1] : undefined;
  };

  // Sắp xếp uniqueTickets theo thời gian lastMsg.sent_at giảm dần (mới nhất lên trên)
  uniqueTickets.sort((a, b) => {
    const isDirectA = a.is_direct || !a.order_id;
    const isDirectB = b.is_direct || !b.order_id;
    const otherUserIdA = isDirectA
      ? (a.buyer_clerk_id === userId ? a.seller_clerk_id : a.buyer_clerk_id)
      : (a.buyer_clerk_id === userId ? a.seller_clerk_id : a.buyer_clerk_id);
    const otherUserIdB = isDirectB
      ? (b.buyer_clerk_id === userId ? b.seller_clerk_id : b.buyer_clerk_id)
      : (b.buyer_clerk_id === userId ? b.seller_clerk_id : b.buyer_clerk_id);
    const lastMsgA = getLastMessage(otherUserIdA, a.order_id);
    const lastMsgB = getLastMessage(otherUserIdB, b.order_id);
    const aTime = lastMsgA?.sent_at ? new Date(lastMsgA.sent_at).getTime() : 0;
    const bTime = lastMsgB?.sent_at ? new Date(lastMsgB.sent_at).getTime() : 0;
    return bTime - aTime;
  });

  // Lọc unreadTickets từ uniqueTickets (sau unique + sort)
  const unreadTickets = uniqueTickets.filter(ticket => ticket.message_count > 0 && ticket.last_message && ticket.last_message.is_read === false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper lấy user info
  const getUserInfo = (clerkId: string) => {
    const user = userInfoMap[clerkId];
    if (!user) return { name: "User", avatar: "/placeholder.svg", online: false };
    // Ưu tiên lastname + firstname, chỉ firstname nếu không có lastname, hoặc username nếu không có cả hai
    let name = "User";
    if (user.lastname && user.firstname) name = `${user.lastname} ${user.firstname}`;
    else if (user.firstname) name = user.firstname;
    else if (user.lastname) name = user.lastname;
    else if (user.username) name = user.username;
    else if (user.name) name = user.name;
    return { ...user, name, online: user.online };
  };

  // Sau khi unique + sort, truyền hội thoại đầu tiên cho cha (nếu có setFirstTicket)
  useEffect(() => {
    if (setFirstTicket) {
      setFirstTicket(uniqueTickets.length > 0 ? (uniqueTickets[0] as Ticket) : null);
    }
  }, [uniqueTickets, selectedTicketId, setFirstTicket]);

  return (
    <div className="w-full border-r lg:w-80 bg-gradient-to-b from-white via-gray-50 to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 h-full rounded-l-2xl shadow-lg">
      <div className="border-b p-4 bg-white/80 dark:bg-gray-900/80 rounded-tl-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 rounded-full border-2 border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:focus:border-emerald-500 transition"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Tabs value={tabValue} onValueChange={setTabValue} defaultValue="all" ref={tabsRef}>
        <TabsList className="grid w-full grid-cols-2 rounded-full bg-gray-100 dark:bg-gray-800 my-2">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white">All</TabsTrigger>
          <TabsTrigger value="unread" className="rounded-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Unread</TabsTrigger>
        </TabsList>
        <div className="h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar pr-1">
          <TabsContent value="all" className="m-0">
            {uniqueTickets.map((ticket) => {
              // Xác định loại ticket
              const isDirect = ticket.is_direct || !ticket.order_id;
              const otherUserId = isDirect
                ? (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id)
                : (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id);
              const userInfo = getUserInfo(otherUserId);

              // Thay vì tính unreadCount từ messages, chỉ lấy từ ticket.unread_count
              const unreadCount = ticket.unread_count || 0;

              const lastMsg = getLastMessage(otherUserId, ticket.order_id);

              return (
                <div
                  key={isDirect ? `direct_${otherUserId}` : `order_${ticket.order_id}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl mb-2 px-3 py-3 transition-all border border-transparent hover:border-emerald-200 hover:bg-emerald-50/60 dark:hover:bg-gray-800/60 shadow-sm ${
                    selectedTicketId === String(isDirect ? otherUserId : ticket.order_id) ? "border-emerald-400 bg-emerald-50/80 dark:bg-gray-800/80" : "bg-white dark:bg-gray-900"
                  }`}
                  onClick={() => {
                    // Gọi markMessagesAsRead khi click vào ticket
                    if (ticket.order_id) {
                      markMessagesAsRead(String(ticket.order_id), undefined);
                    } else if (ticket.is_direct) {
                      const receiverId = ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id;
                      markMessagesAsRead(undefined, receiverId);
                    }
                    onSelectTicket({ ...ticket, last_message: ticket.last_message ?? undefined });
                  }}
                >
                  <div className="relative group">
                    <Image
                      src={userInfo.avatar ? userInfo.avatar : '/placeholder.svg'}
                      alt={userInfo.name}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-emerald-100 shadow group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Badge online realtime */}
                    <span className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${userInfo.online ? "bg-emerald-400" : "bg-gray-300"}`}></span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base truncate text-gray-900 dark:text-white">
                        {isDirect ? userInfo.name : `Order #${ticket.order_id}`}
                      </h3>
                      <span className="text-xs text-gray-400 font-semibold">
                        {lastMsg?.sent_at ? formatDate(lastMsg.sent_at) : ""}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {lastMsg?.message_content || <span className="italic text-gray-400">No messages yet</span>}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {!isDirect && ticket.order_status && (
                        <span className="text-xs text-gray-400 font-medium">{ticket.order_status}</span>
                      )}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <span
                      className="ml-2 flex items-center justify-center h-3 w-3 rounded-full bg-emerald-500 shadow border-2 border-white dark:border-gray-900"
                      title="Unread messages"
                    />
                  )}
                </div>
              );
            })}
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            {unreadTickets.map((ticket) => {
              const isDirect = ticket.is_direct || !ticket.order_id;
              const otherUserId = isDirect
                ? (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id)
                : (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id);
              const userInfo = getUserInfo(otherUserId);
              const unreadCount = ticket.unread_count || 0;
              const lastMsg = getLastMessage(otherUserId, ticket.order_id);
              return (
                <div
                  key={isDirect ? `direct_${otherUserId}` : `order_${ticket.order_id}`}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl mb-2 px-3 py-3 transition-all border border-transparent hover:border-emerald-200 hover:bg-emerald-50/60 dark:hover:bg-gray-800/60 shadow-sm ${
                    selectedTicketId === String(isDirect ? otherUserId : ticket.order_id) ? "border-emerald-400 bg-emerald-50/80 dark:bg-gray-800/80" : "bg-white dark:bg-gray-900"
                  }`}
                  onClick={() => {
                    if (ticket.order_id) {
                      markMessagesAsRead(String(ticket.order_id), undefined);
                    } else if (ticket.is_direct) {
                      const receiverId = ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id;
                      markMessagesAsRead(undefined, receiverId);
                    }
                    onSelectTicket({ ...ticket, last_message: ticket.last_message ?? undefined });
                    setTabValue("all"); // Chuyển sang tab All sau khi đọc
                  }}
                >
                  <div className="relative group">
                    <Image
                      src={userInfo.avatar ? userInfo.avatar : '/placeholder.svg'}
                      alt={userInfo.name}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-emerald-100 shadow group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Badge online realtime */}
                    <span className={`absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${userInfo.online ? "bg-emerald-400" : "bg-gray-300"}`}></span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base truncate text-gray-900 dark:text-white">
                        {isDirect ? userInfo.name : `Order #${ticket.order_id}`}
                      </h3>
                      <span className="text-xs text-gray-400 font-semibold">
                        {lastMsg?.sent_at ? formatDate(lastMsg.sent_at) : ""}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {lastMsg?.message_content || <span className="italic text-gray-400">No messages yet</span>}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      {!isDirect && ticket.order_status && (
                        <span className="text-xs text-gray-400 font-medium">{ticket.order_status}</span>
                      )}
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <span
                      className="ml-2 flex items-center justify-center h-3 w-3 rounded-full bg-emerald-500 shadow border-2 border-white dark:border-gray-900"
                      title="Unread messages"
                    />
                  )}
                </div>
              );
            })}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}