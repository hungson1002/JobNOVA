"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Search, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Image from "next/image";
import { toast } from "react-hot-toast";

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

// Add Pagination component
function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisiblePages = 5;
  let visiblePages = pages;
  if (totalPages > maxVisiblePages) {
    const start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const end = Math.min(totalPages, start + maxVisiblePages - 1);
    visiblePages = pages.slice(start - 1, end);
  }
  return (
    <div className="flex flex-col gap-2 py-4 border-t bg-gray-50/50">
      <div className="flex justify-center">
        <span className="text-sm font-medium text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {visiblePages[0] > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(1)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              1
            </Button>
            {visiblePages[0] > 2 && (
              <span className="px-2 text-gray-500">...</span>
            )}
          </>
        )}
        {visiblePages.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={`h-8 w-8 p-0 ${
              currentPage === page
                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                : "hover:bg-gray-100"
            }`}
          >
            {page}
          </Button>
        ))}
        {visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
              <span className="px-2 text-gray-500">...</span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(totalPages)}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              {totalPages}
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="h-8 w-8 p-0 hover:bg-gray-100"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ManageOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [userCache, setUserCache] = useState<Record<string, UserInfo>>({});
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(true);

  // Pagination state
  const PAGE_SIZE = 5;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [statusFilter, searchTerm, orders]);
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const ordersToShow = filteredOrders.slice(startIdx, startIdx + PAGE_SIZE);

  useEffect(() => {
    async function fetchOrders() {
      if (!userId) return;
      setLoading(true);
      try {
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
      } catch (error) {
        toast.error("Failed to fetch orders");
      } finally {
        setLoading(false);
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
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight mb-2">Order Management</h1>
          <p className="text-lg text-gray-500">View and manage all orders on the platform</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] rounded-lg">
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
              className="pl-8 w-56 rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>
      <Card className="rounded-2xl border-2 border-gray-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mr-2" />
              <span className="text-lg text-gray-500">Loading orders...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-900">
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Order ID</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Buyer</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Seller</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Total</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Status</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700">Date</TableHead>
                    <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersToShow.length > 0 ? ordersToShow.map(order => (
                    <TableRow
                      key={order.id}
                      className="hover:bg-emerald-50 transition-all"
                    >
                      <TableCell className="py-3 px-6 text-base">{order.id}</TableCell>
                      <TableCell className="py-3 px-6">{renderUserInfo(order.buyer)}</TableCell>
                      <TableCell className="py-3 px-6">{renderUserInfo(order.seller)}</TableCell>
                      <TableCell className="py-3 px-6 text-base font-semibold">${order.total.toLocaleString()}</TableCell>
                      <TableCell className="py-3 px-6">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[order.status] || "bg-gray-100 text-gray-700"}`}>
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 px-6 text-base">{new Date(order.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="py-3 px-6 text-right">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => setSelectedOrder(order)}
                          className="rounded-full border-emerald-200 hover:bg-emerald-100"
                          aria-label="View Details"
                        >
                          <Eye className="h-5 w-5 text-emerald-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-lg">
                        No orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl border-2 border-emerald-100 max-w-lg w-full p-6 relative animate-fade-in"
            onClick={e => e.stopPropagation()}
          >
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700"
              onClick={() => setSelectedOrder(null)}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-emerald-700 mb-4">Order #{selectedOrder.id}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Buyer:</span>
                <div>{renderUserInfo(selectedOrder.buyer)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Seller:</span>
                <div>{renderUserInfo(selectedOrder.seller)}</div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Total:</span>
                <span className="font-semibold">${selectedOrder.total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[selectedOrder.status] || "bg-gray-100 text-gray-700"}`}>
                  {selectedOrder.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Date:</span>
                <span>{new Date(selectedOrder.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 