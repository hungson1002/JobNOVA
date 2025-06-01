import Link from "next/link";
import Image from "next/image";
import { Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Ticket as OriginalTicket } from "@/hooks/useMessages";
import { useEffect, useState } from "react";
import { fetchUser } from "@/lib/api";

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

  return (
    <div className="w-full border-r lg:w-80">
      <div className="border-b p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
            {filteredTickets.map((ticket) => {
              // Xác định loại ticket
              const isDirect = ticket.is_direct || !ticket.order_id;
              // Lấy userId của người đối thoại
              const otherUserId = isDirect 
                ? (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id)
                : (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id);
              const userInfo = getUserInfo(otherUserId);

              return (
                <div
                  key={isDirect ? otherUserId : ticket.order_id}
                  className={`flex cursor-pointer items-start gap-3 border-b p-3 hover:bg-gray-50 ${
                    selectedTicketId === String(isDirect ? otherUserId : ticket.order_id) ? "bg-gray-50" : ""
                  }`}
                  onClick={() => onSelectTicket({ ...ticket, last_message: ticket.last_message ?? undefined })}
                >
                  <div className="relative">
                    <Image
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {isDirect ? userInfo.name : `Order #${ticket.order_id}`}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {ticket.last_message?.sent_at ? formatDate(ticket.last_message.sent_at) : ""}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-600">
                      {ticket.last_message?.message_content || "No messages"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {isDirect ? "Direct" : ticket.status}
                      </Badge>
                      {!isDirect && ticket.order_status && (
                        <span className="text-xs text-gray-500">{ticket.order_status}</span>
                      )}
                      <span className="text-xs text-gray-500">{ticket.message_count} msg</span>
                    </div>
                  </div>
                  {ticket.message_count > 0 && !ticket.last_message?.is_read && (
                    <Badge className="h-5 w-5 rounded-full bg-emerald-500 p-0 text-center">
                      {ticket.message_count}
                    </Badge>
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
                  className={`flex cursor-pointer items-start gap-3 border-b p-3 hover:bg-gray-50 ${
                    selectedTicketId === String(ticket.order_id) ? "bg-gray-50" : ""
                  }`}
                  onClick={() =>
                    onSelectTicket({
                      ...ticket,
                      last_message: ticket.last_message ?? undefined,
                    })
                  }
                >
                  <div className="relative">
                    <Image
                      src={userInfo.avatar}
                      alt={userInfo.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">
                        {isDirect ? userInfo.name : `Order #${ticket.order_id}`}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {ticket.last_message?.sent_at ? formatDate(ticket.last_message.sent_at) : ""}
                      </span>
                    </div>
                    <p className="truncate text-sm text-gray-600">
                      {ticket.last_message?.message_content || "No messages"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {isDirect ? "Direct" : ticket.status}
                      </Badge>
                      {!isDirect && (
                        <span className="text-xs text-gray-500">{ticket.order_status}</span>
                      )}
                      {!isDirect && (
                        <span className="text-xs text-gray-500">{ticket.message_count} msg</span>
                      )}
                    </div>
                  </div>
                  {ticket.message_count > 0 && !ticket.last_message?.is_read && (
                    <Badge className="h-5 w-5 rounded-full bg-emerald-500 p-0 text-center">
                      {ticket.message_count}
                    </Badge>
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