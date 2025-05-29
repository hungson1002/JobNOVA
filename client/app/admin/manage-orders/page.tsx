"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Search, X } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";

interface Order {
  id: number;
  buyer: string;
  seller: string;
  total: number;
  status: string;
  created_at: string;
}

interface UserInfo {
  clerk_id: string;
  firstname?: string;
  lastname?: string;
  username?: string;
  avatar?: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  delivered: "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userCache, setUserCache] = useState<Record<string, UserInfo>>({});
  const { getToken, userId } = useAuth();

  useEffect(() => {
    async function fetchOrders() {
      if (!userId) return;
      const token = await getToken();
      const res = await fetch(`http://localhost:8800/api/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        const mapped = data.orders.map((order: any) => ({
          id: order.id,
          buyer: order.buyer_clerk_id,
          seller: order.seller_clerk_id,
          total: order.total_price,
          status: order.order_status,
          created_at: order.order_date,
        }));
        setOrders(mapped);
        setFilteredOrders(mapped);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    }
    fetchOrders();
  }, [getToken, userId]);

  useEffect(() => {
    let filtered = orders;
    if (statusFilter !== "all") {
      filtered = filtered.filter((o) => o.status === statusFilter);
    }
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (o) =>
          (userCache[o.buyer]?.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userCache[o.buyer]?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userCache[o.buyer]?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.buyer.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (userCache[o.seller]?.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userCache[o.seller]?.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userCache[o.seller]?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            o.seller.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    setFilteredOrders(filtered);
  }, [orders, statusFilter, searchTerm, userCache]);

  useEffect(() => {
    const uniqueIds = Array.from(
      new Set([
        ...orders.map((o) => o.buyer),
        ...orders.map((o) => o.seller),
      ])
    ).filter((id) => id && !userCache[id]);
    if (uniqueIds.length === 0) return;
    uniqueIds.forEach(async (clerk_id) => {
      try {
        const res = await fetch(`http://localhost:8800/api/${clerk_id}`);
        if (res.ok) {
          const user = await res.json();
          setUserCache((prev) => ({ ...prev, [clerk_id]: user }));
        }
      } catch {}
    });
  }, [orders]);

  function renderUserInfo(clerk_id: string) {
    const user = userCache[clerk_id];
    if (!user) return <span className="text-xs text-gray-400">{clerk_id}</span>;
    let name = "";
    if (user.firstname || user.lastname) {
      name = `${user.firstname || ""} ${user.lastname || ""}`.trim();
    } else if (user.username) {
      name = user.username;
    } else {
      name = clerk_id;
    }
    return (
      <div className="flex items-center gap-2">
        {user.avatar ? (
          <Image src={user.avatar} alt={name} width={28} height={28} className="rounded-full object-cover" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-medium text-gray-900 text-sm">{name}</div>
          <div className="text-xs text-gray-400">{clerk_id}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Order Management</h1>
          <p className="text-muted-foreground">View and manage all orders on the platform</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search buyer or seller..."
              className="pl-8 w-56"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>List of all platform orders</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length > 0 ? filteredOrders.map(order => (
                <TableRow
                  key={order.id}
                  className="transition hover:bg-emerald-50 cursor-pointer"
                >
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{renderUserInfo(order.buyer)}</TableCell>
                  <TableCell>{renderUserInfo(order.seller)}</TableCell>
                  <TableCell>${order.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">No orders found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal xem chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setSelectedOrder(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold mb-4">Order #{selectedOrder.id}</h2>
            <div className="space-y-2">
              <div><b>Buyer:</b> {renderUserInfo(selectedOrder.buyer)}</div>
              <div><b>Seller:</b> {renderUserInfo(selectedOrder.seller)}</div>
              <div><b>Total:</b> ${selectedOrder.total.toLocaleString()}</div>
              <div><b>Status:</b> <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[selectedOrder.status] || "bg-gray-100 text-gray-700"}`}>{selectedOrder.status}</span></div>
              <div><b>Date:</b> {new Date(selectedOrder.created_at).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 