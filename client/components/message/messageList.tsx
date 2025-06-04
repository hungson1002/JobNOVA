import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket as OriginalTicket } from "@/hooks/useMessages";
import { useEffect, useState } from "react";
import { fetchUser } from "@/lib/api";
import { useMessages } from "@/hooks/useMessages";

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
}

interface UserInfo {
  name: string;
  avatar: string;
  lastname?: string;
  firstname?: string;
  username?: string;
}

export function MessageList({ tickets, selectedTicketId, onSelectTicket, userId }: MessageListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userInfoMap, setUserInfoMap] = useState<Record<string, UserInfo>>({});
  const { markMessagesAsRead } = useMessages({});

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

  const filteredTickets = tickets.filter((ticket) =>
    ticket.last_message?.message_content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadTickets = filteredTickets.filter((ticket) => ticket.message_count > 0 && !ticket.last_message?.is_read);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Helper lấy user info
  const getUserInfo = (clerkId: string) => {
    const user = userInfoMap[clerkId];
    if (!user) return { name: "User", avatar: "/placeholder.svg" };
    // Ưu tiên lastname + firstname, chỉ firstname nếu không có lastname, hoặc username nếu không có cả hai
    let name = "User";
    if (user.lastname && user.firstname) name = `${user.lastname} ${user.firstname}`;
    else if (user.firstname) name = user.firstname;
    else if (user.lastname) name = user.lastname;
    else if (user.username) name = user.username;
    else if (user.name) name = user.name;
    return { ...user, name };
  };

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

  return (
    <div className="w-full border-r lg:w-80 bg-gradient-to-b from-white via-gray-50 to-emerald-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 h-full rounded-l-2xl shadow-lg">
      <div className="border-b p-4 bg-white/80 dark:bg-gray-900/80 rounded-tl-2xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9 rounded-full border-2 border-gray-200 focus:border-emerald-500 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:focus:border-emerald-500 transition"
            placeholder="Tìm kiếm hội thoại..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3 rounded-full bg-gray-100 dark:bg-gray-800 my-2">
          <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Tất cả</TabsTrigger>
          <TabsTrigger value="unread" className="rounded-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Chưa đọc</TabsTrigger>
          <TabsTrigger value="archived" className="rounded-full data-[state=active]:bg-emerald-500 data-[state=active]:text-white">Lưu trữ</TabsTrigger>
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
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-emerald-100 shadow group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Badge online giả lập, nếu muốn realtime thì truyền prop online vào userInfo */}
                    <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 bg-emerald-400"></span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base truncate text-gray-900 dark:text-white">
                        {isDirect ? userInfo.name : `Order #${ticket.order_id}`}
                      </h3>
                      <span className="text-xs text-gray-400 font-semibold">
                        {ticket.last_message?.sent_at ? formatDate(ticket.last_message.sent_at) : ""}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {ticket.last_message?.message_content || <span className="italic text-gray-400">Chưa có tin nhắn</span>}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full border-emerald-300 bg-emerald-50 text-emerald-700">
                        {isDirect ? "Direct" : ticket.status}
                      </Badge>
                      {!isDirect && ticket.order_status && (
                        <span className="text-xs text-gray-400 font-medium">{ticket.order_status}</span>
                      )}
                      <span className="text-xs text-gray-400 font-medium">{ticket.message_count} tin</span>
                    </div>
                  </div>
                  {unreadCount > 0 && (
                    <span
                      className="ml-2 flex items-center justify-center h-3 w-3 rounded-full bg-emerald-500 shadow border-2 border-white dark:border-gray-900"
                      title="Có tin nhắn chưa đọc"
                    />
                  )}
                </div>
              );
            })}
          </TabsContent>
          <TabsContent value="unread" className="m-0">
            {unreadTickets.map((ticket) => {
              const isDirect = !ticket.order_id;
              const userId = isDirect ? (ticket.buyer_clerk_id || ticket.seller_clerk_id) : (ticket.buyer_clerk_id || ticket.seller_clerk_id);
              const userInfo = getUserInfo(userId);
              return (
                <div
                  key={ticket.order_id || userId}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl mb-2 px-3 py-3 transition-all border border-transparent hover:border-emerald-200 hover:bg-emerald-50/60 dark:hover:bg-gray-800/60 shadow-sm ${
                    selectedTicketId === String(ticket.order_id) ? "border-emerald-400 bg-emerald-50/80 dark:bg-gray-800/80" : "bg-white dark:bg-gray-900"
                  }`}
                  onClick={() =>
                    onSelectTicket({
                      ...ticket,
                      last_message: ticket.last_message ?? undefined,
                    })
                  }
                >
                  <div className="relative group">
                    <Image
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      width={48}
                      height={48}
                      className="rounded-full border-2 border-emerald-100 shadow group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Badge online giả lập, nếu muốn realtime thì truyền prop online vào userInfo */}
                    <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 bg-emerald-400"></span>
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base truncate text-gray-900 dark:text-white">
                        {isDirect ? userInfo.name : `Order #${ticket.order_id}`}
                      </h3>
                      <span className="text-xs text-gray-400 font-semibold">
                        {ticket.last_message?.sent_at ? formatDate(ticket.last_message.sent_at) : ""}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-600 dark:text-gray-300 mt-1">
                      {ticket.last_message?.message_content || <span className="italic text-gray-400">Chưa có tin nhắn</span>}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full border-emerald-300 bg-emerald-50 text-emerald-700">
                        {isDirect ? "Direct" : ticket.status}
                      </Badge>
                      {!isDirect && ticket.order_status && (
                        <span className="text-xs text-gray-400 font-medium">{ticket.order_status}</span>
                      )}
                      <span className="text-xs text-gray-400 font-medium">{ticket.message_count} tin</span>
                    </div>
                  </div>
                  {ticket.message_count > 0 && !ticket.last_message?.is_read && (
                    <span className="ml-2 flex items-center justify-center h-6 w-6 rounded-full bg-emerald-500 text-white text-xs font-bold shadow border-2 border-white dark:border-gray-900">
                      {ticket.message_count}
                    </span>
                  )}
                </div>
              );
            })}
          </TabsContent>
          <TabsContent value="archived" className="m-0">
            <div className="flex h-40 items-center justify-center text-center text-gray-500">
              <p>No archived conversations</p>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}