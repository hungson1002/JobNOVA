"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Search, Filter, Eye, MoreVertical, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@clerk/nextjs"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useNotification } from "@/context/notification-context"
import { Label } from "@/components/ui/label"

interface Gig {
  id: number;
  title: string;
  description: string;
  seller_clerk_id: string;
  category_id: number;
  job_type_id: number;
  starting_price: number;
  delivery_time: number;
  gig_image: string;
  city: string;
  country: string;
  status: string;
  created_at: string;
  category?: {
    id: number;
    name: string;
  };
  job_type?: {
    id: number;
    job_type: string;
  };
  gig_images?: string[];
  seller?: {
    firstname?: string;
    lastname?: string;
    username?: string;
  };
}

export default function ManageGigsPage() {
  const [isClient, setIsClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("pending")
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { getToken, userId } = useAuth();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const { addNotification } = useNotification();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [gigToDelete, setGigToDelete] = useState<Gig | null>(null);

  const statusMap: Record<string, string> = {
    pending: "pending",
    approved: "active",
    rejected: "rejected",
  };

  const fetchGigs = async (tabValue = "pending") => {
    setLoading(true);
    const status = statusMap[tabValue] || "pending";
    try {
      const response = await fetch(`http://localhost:8800/api/gigs?include=category,job_type&status=${status}`);
      const data = await response.json();
      if (data.success) {
        setGigs(data.gigs);
      }
    } catch (error) {
      toast("Failed to fetch gigs");
    } finally {
      setLoading(false);
    }
  };

  // Hàm lấy số lượng gig cho từng trạng thái
  const fetchCounts = async () => {
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        fetch("http://localhost:8800/api/gigs?status=pending&limit=1"),
        fetch("http://localhost:8800/api/gigs?status=active&limit=1"),
        fetch("http://localhost:8800/api/gigs?status=rejected&limit=1"),
      ]);
      const pendingData = await pendingRes.json();
      const approvedData = await approvedRes.json();
      const rejectedData = await rejectedRes.json();
      setCounts({
        pending: pendingData.total || 0,
        approved: approvedData.total || 0,
        rejected: rejectedData.total || 0,
      });
    } catch (error) {
      // Không cần toast lỗi ở đây
    }
  };

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8800/api/categories");
        const data = await response.json();
        if (data.success && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      } catch (error) {
        // Không cần toast lỗi ở đây
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchGigs(tab);
    fetchCounts();
  }, [tab]);

  const handleTabChange = (value: string) => {
    setTab(value);
    fetchGigs(value);
  };

  const handleApprove = async (gigId: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:8800/api/gigs/${gigId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Gig has been approved");
        setGigs(prev => prev.filter(gig => gig.id !== gigId));
        fetchCounts();
      }
    } catch (error) {
      toast("Failed to approve gig");
    }
  };

  const handleReject = async (gigId: number) => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:8800/api/gigs/${gigId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "rejected" }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Gig has been rejected");
        setGigs(prev => prev.filter(gig => gig.id !== gigId));
        fetchCounts();
      }
    } catch (error) {
      toast("Failed to reject gig");
    }
  };

  // Filter gigs based on search and category
  const filteredGigs = gigs.filter((gig) => {
    const matchesSearch =
      gig.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gig.seller_clerk_id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || gig.category?.name === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Group gigs by status
  // const pendingGigs = filteredGigs.filter(gig => gig.status === "pending")
  // const approvedGigs = filteredGigs.filter(gig => gig.status === "active")
  // const rejectedGigs = filteredGigs.filter(gig => gig.status === "rejected")

  // Hiển thị luôn gigs theo tab hiện tại
  const displayedGigs = filteredGigs

  const handleView = (gig: Gig) => {
    setSelectedGig(gig);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGig(null);
  };

  const handleDelete = async () => {
    if (!gigToDelete) return;
    // Kiểm tra các trường bắt buộc trước khi gửi notification
    if (!gigToDelete.seller_clerk_id) {
      toast.error("Seller ID is missing, cannot send notification!");
      return;
    }
    if (!gigToDelete.title) {
      toast.error("Gig title is missing, cannot send notification!");
      return;
    }
    if (!deleteReason.trim()) {
      toast.error("Please enter a reason for deletion!");
      return;
    }
    let notificationOk = true;
    try {
      // 1. Gửi notification trước (nếu cần, nhưng BE sẽ xử lý)
      // 2. Xóa gig sau khi gửi notification
      await fetch(`http://localhost:8800/api/gigs/${gigToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${await getToken()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reason: deleteReason }) // Gửi lý do xóa lên BE
      });
      setGigs(prev => prev.filter(gig => gig.id !== gigToDelete.id));
      fetchCounts();
      toast.success("Xóa thành công!");
      setDeleteDialogOpen(false);
      setDeleteReason("");
      setGigToDelete(null);
    } catch (error) {
      toast.error("Xóa thất bại!");
    }
  };

  if (!isClient) {
    return null
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight mb-2">Service Management</h1>
        <p className="text-lg text-gray-500">Review, approve, and manage all gigs/services on the platform</p>
      </div>
      {/* Search & Filter Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/80 rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative flex-1 w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title or seller..."
            className="pl-8 rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px] rounded-lg">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Card className="rounded-2xl border-2 border-gray-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="animate-spin h-8 w-8 text-emerald-500 mr-2" />
              <span className="text-lg text-gray-500">Loading gigs...</span>
            </div>
          ) : (
            <Tabs value={tab} onValueChange={handleTabChange} defaultValue="pending">
              <TabsList className="mb-4 mt-6 flex justify-around w-full">
                <TabsTrigger value="pending" className="w-full justify-center">
                  Pending
                  <Badge variant="secondary" className="ml-2">
                    {counts.pending}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="approved" className="w-full justify-center">
                  Approved
                  <Badge variant="secondary" className="ml-2">
                    {counts.approved}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="w-full justify-center">
                  Rejected
                  <Badge variant="secondary" className="ml-2">
                    {counts.rejected}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tab === "pending" && displayedGigs.length > 0 ? (
                      displayedGigs.map((gig) => (
                        <TableRow key={gig.id}>
                          <TableCell>
                            {gig.gig_images && gig.gig_images.length > 0 ? (
                              <img src={gig.gig_images[0]} alt="Gig" className="w-28 h-28 object-cover rounded-md border" />
                            ) : gig.gig_image ? (
                              <img src={gig.gig_image} alt="Gig" className="w-28 h-28 object-cover rounded-md border" />
                            ) : (
                              <div className="w-28 h-28 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[200px] truncate cursor-pointer">
                                    {gig.title}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span className="select-all break-all">{gig.title}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[120px] truncate cursor-pointer">
                                    {(() => {
                                      const sellerName = gig.seller
                                        ? gig.seller.firstname && gig.seller.lastname
                                          ? `${gig.seller.firstname} ${gig.seller.lastname}`
                                          : gig.seller.firstname || gig.seller.lastname || gig.seller.username || gig.seller_clerk_id || "N/A"
                                        : gig.seller_clerk_id || "N/A";
                                      if (sellerName.length > 16) {
                                        return sellerName;
                                      }
                                      return sellerName;
                                    })()}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span className="select-all break-all">{(() => {
                                    const sellerName = gig.seller
                                      ? gig.seller.firstname && gig.seller.lastname
                                        ? `${gig.seller.firstname} ${gig.seller.lastname}`
                                        : gig.seller.firstname || gig.seller.lastname || gig.seller.username || gig.seller_clerk_id || "N/A"
                                      : gig.seller_clerk_id || "N/A";
                                    return sellerName;
                                  })()}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{gig.category?.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              gig.status === "pending"
                                ? "bg-gray-200 text-gray-700"
                                : gig.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }>
                              {gig.status === "pending"
                                ? "Pending"
                                : gig.status === "active"
                                ? "Active"
                                : "Rejected"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(gig.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 flex items-center justify-center">
                                  <MoreVertical className="h-5 w-5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl shadow-xl py-2 min-w-[200px] border border-gray-100 bg-white">
                                <DropdownMenuItem onClick={() => handleView(gig)} className="gap-2 px-4 py-2 hover:bg-emerald-50 rounded-xl font-medium text-gray-800">
                                  <Eye className="h-4 w-4 text-emerald-500" />
                                  <span>View detail</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {tab === "pending" && (
                                  <>
                                    <DropdownMenuItem
                                      className="gap-2 px-4 py-2 text-emerald-700 font-semibold hover:bg-emerald-50 rounded-xl"
                                      onClick={async () => { await handleApprove(gig.id); }}
                                    >
                                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                                      <span>Approve</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="gap-2 px-4 py-2 text-red-600 font-semibold hover:bg-red-50 rounded-xl"
                                      onClick={async () => { await handleReject(gig.id); }}
                                    >
                                      <XCircle className="h-4 w-4 text-red-500" />
                                      <span>Reject</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                  </>
                                )}
                                <DropdownMenuItem
                                  className="gap-2 px-4 py-2 text-red-700 font-bold hover:bg-red-100 rounded-xl"
                                  onClick={() => { setGigToDelete(gig); setDeleteDialogOpen(true); }}
                                >
                                  <XCircle className="h-4 w-4 text-red-700" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No pending gigs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="approved">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tab === "approved" && displayedGigs.length > 0 ? (
                      displayedGigs.map((gig) => (
                        <TableRow key={gig.id}>
                          <TableCell>
                            {gig.gig_images && gig.gig_images.length > 0 ? (
                              <img src={gig.gig_images[0]} alt="Gig" className="w-28 h-28 object-cover rounded-md border" />
                            ) : gig.gig_image ? (
                              <img src={gig.gig_image} alt="Gig" className="w-28 h-28 object-cover rounded-md border" />
                            ) : (
                              <div className="w-28 h-28 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[200px] truncate cursor-pointer">
                                    {gig.title}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span className="select-all break-all">{gig.title}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[120px] truncate cursor-pointer">
                                    {(() => {
                                      const sellerName = gig.seller
                                        ? gig.seller.firstname && gig.seller.lastname
                                          ? `${gig.seller.firstname} ${gig.seller.lastname}`
                                          : gig.seller.firstname || gig.seller.lastname || gig.seller.username || gig.seller_clerk_id || "N/A"
                                        : gig.seller_clerk_id || "N/A";
                                      if (sellerName.length > 16) {
                                        return sellerName;
                                      }
                                      return sellerName;
                                    })()}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span className="select-all break-all">{(() => {
                                    const sellerName = gig.seller
                                      ? gig.seller.firstname && gig.seller.lastname
                                        ? `${gig.seller.firstname} ${gig.seller.lastname}`
                                        : gig.seller.firstname || gig.seller.lastname || gig.seller.username || gig.seller_clerk_id || "N/A"
                                      : gig.seller_clerk_id || "N/A";
                                    return sellerName;
                                  })()}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{gig.category?.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              gig.status === "pending"
                                ? "bg-gray-200 text-gray-700"
                                : gig.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }>
                              {gig.status === "pending"
                                ? "Pending"
                                : gig.status === "active"
                                ? "Active"
                                : "Rejected"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(gig.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl shadow-xl py-2 min-w-[200px] border border-gray-100 bg-white">
                                <DropdownMenuItem onClick={() => handleView(gig)} className="gap-2 px-4 py-2 hover:bg-emerald-50 rounded-xl font-medium text-gray-800">
                                  <Eye className="h-4 w-4 text-emerald-500" />
                                  <span>View detail</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="gap-2 px-4 py-2 text-red-700 font-bold hover:bg-red-100 rounded-xl"
                                  onClick={() => { setGigToDelete(gig); setDeleteDialogOpen(true); }}
                                >
                                  <XCircle className="h-4 w-4 text-red-700" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No approved gigs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="rejected">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approved Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tab === "rejected" && displayedGigs.length > 0 ? (
                      displayedGigs.map((gig) => (
                        <TableRow key={gig.id}>
                          <TableCell>
                            {gig.gig_images && gig.gig_images.length > 0 ? (
                              <img src={gig.gig_images[0]} alt="Gig" className="w-28 h-28 object-cover rounded-md border" />
                            ) : gig.gig_image ? (
                              <img src={gig.gig_image} alt="Gig" className="w-28 h-28 object-cover rounded-md border" />
                            ) : (
                              <div className="w-28 h-28 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">No Image</div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[200px] truncate cursor-pointer">
                                    {gig.title}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span className="select-all break-all">{gig.title}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="block max-w-[120px] truncate cursor-pointer">
                                    {(() => {
                                      const sellerName = gig.seller
                                        ? gig.seller.firstname && gig.seller.lastname
                                          ? `${gig.seller.firstname} ${gig.seller.lastname}`
                                          : gig.seller.firstname || gig.seller.lastname || gig.seller.username || gig.seller_clerk_id || "N/A"
                                        : gig.seller_clerk_id || "N/A";
                                      if (sellerName.length > 16) {
                                        return sellerName;
                                      }
                                      return sellerName;
                                    })()}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <span className="select-all break-all">{(() => {
                                    const sellerName = gig.seller
                                      ? gig.seller.firstname && gig.seller.lastname
                                        ? `${gig.seller.firstname} ${gig.seller.lastname}`
                                        : gig.seller.firstname || gig.seller.lastname || gig.seller.username || gig.seller_clerk_id || "N/A"
                                      : gig.seller_clerk_id || "N/A";
                                    return sellerName;
                                  })()}</span>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>{gig.category?.name}</TableCell>
                          <TableCell>
                            <Badge className={
                              gig.status === "pending"
                                ? "bg-gray-200 text-gray-700"
                                : gig.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-red-100 text-red-700"
                            }>
                              {gig.status === "pending"
                                ? "Pending"
                                : gig.status === "active"
                                ? "Active"
                                : "Rejected"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(gig.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-2xl shadow-xl py-2 min-w-[200px] border border-gray-100 bg-white">
                                <DropdownMenuItem onClick={() => handleView(gig)} className="gap-2 px-4 py-2 hover:bg-emerald-50 rounded-xl font-medium text-gray-800">
                                  <Eye className="h-4 w-4 text-emerald-500" />
                                  <span>View detail</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="gap-2 px-4 py-2 text-red-700 font-bold hover:bg-red-100 rounded-xl"
                                  onClick={() => { setGigToDelete(gig); setDeleteDialogOpen(true); }}
                                >
                                  <XCircle className="h-4 w-4 text-red-700" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center">
                          No rejected gigs found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Modal xem chi tiết gig */}
      <style>{`
        [data-radix-dialog-close], button[aria-label="Close"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }
        .dialog-content::-webkit-scrollbar { width: 8px; }
        .dialog-content::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 8px; }
        .dialog-content::-webkit-scrollbar-track { background: #fff; }
      `}</style>
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent 
          className="dialog-content max-w-2xl w-full max-h-[80vh] overflow-y-auto p-0 rounded-2xl border border-gray-200 shadow-xl bg-white"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Gig Details</DialogTitle>
            <DialogDescription>Detailed information about the gig</DialogDescription>
          </DialogHeader>
          {selectedGig && (
            <div className="">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 bg-white rounded-t-2xl relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-lg font-bold text-emerald-600 border border-emerald-200">
                    {selectedGig.seller?.firstname?.[0] || selectedGig.seller?.username?.[0] || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-gray-900">{selectedGig.title}</h2>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${selectedGig.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : selectedGig.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedGig.status.charAt(0).toUpperCase() + selectedGig.status.slice(1)}</span>
                    </div>
                    <div className="text-xs text-gray-500 font-medium">Seller: <span className="text-gray-700 font-semibold">{selectedGig.seller?.firstname && selectedGig.seller?.lastname ? `${selectedGig.seller.firstname} ${selectedGig.seller.lastname}` : selectedGig.seller?.firstname || selectedGig.seller?.username || selectedGig.seller_clerk_id || 'N/A'}</span></div>
                  </div>
                </div>
                <button onClick={handleCloseModal} className="absolute top-4 right-4 bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 rounded-full p-2 shadow-sm border border-gray-200 transition-all">
                  <span className="sr-only">Close</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Image(s) */}
              {selectedGig.gig_images && selectedGig.gig_images.length > 0 ? (
                <div className={`w-full px-6 pt-6 pb-2 ${selectedGig.gig_images.length === 1 ? 'flex justify-center items-center' : ''}`}>
                  {selectedGig.gig_images.length === 1 ? (
                    selectedGig.gig_images[0].match(/\.(mp4|mov|avi|wmv)$/i) ? (
                      <video src={selectedGig.gig_images[0]} controls className="rounded-xl border border-gray-200 shadow w-full max-w-lg h-56 object-cover bg-black" />
                    ) : (
                      <img src={selectedGig.gig_images[0]} alt="Gig" className="rounded-xl border border-gray-200 shadow w-full max-w-lg h-56 object-cover" />
                    )
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
                      {selectedGig.gig_images.map((url: string, idx: number) =>
                        url.match(/\.(mp4|mov|avi|wmv)$/i) ? (
                          <video key={idx} src={url} controls className="rounded-xl border border-gray-200 shadow w-full h-40 object-cover bg-black hover:scale-105 transition-transform duration-200" />
                        ) : (
                          <img key={idx} src={url} alt={`Gig media ${idx + 1}`} className="rounded-xl border border-gray-200 shadow w-full h-40 object-cover hover:scale-105 transition-transform duration-200" />
                        )
                      )}
                    </div>
                  )}
                </div>
              ) : selectedGig.gig_image ? (
                <div className="flex justify-center items-center px-6 pt-6 pb-2">
                  <img src={selectedGig.gig_image} alt="Gig" className="rounded-xl border border-gray-200 shadow w-full max-w-lg h-56 object-cover" />
                </div>
              ) : (
                <div className="flex justify-center items-center px-6 pt-6 pb-2">
                  <div className="w-full max-w-lg h-56 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 text-gray-400">No Image</div>
                </div>
              )}

              {/* Info grid */}
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Title</span>
                    <span className="text-base font-bold text-emerald-700">{selectedGig.title}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Seller</span>
                    <span className="text-sm font-medium text-gray-800">{selectedGig.seller?.firstname && selectedGig.seller?.lastname ? `${selectedGig.seller.firstname} ${selectedGig.seller.lastname}` : selectedGig.seller?.firstname || selectedGig.seller?.username || selectedGig.seller_clerk_id || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Category</span>
                    <span className="text-sm font-medium text-blue-700">{selectedGig.category?.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Job Type</span>
                    <span className="text-sm font-medium text-indigo-700">{selectedGig.job_type?.job_type}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Price</span>
                    <span className="text-base font-bold text-pink-600">${selectedGig.starting_price}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Delivery Time</span>
                    <span className="text-sm font-semibold text-orange-600">{selectedGig.delivery_time} days</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Location</span>
                    <span className="text-sm font-medium text-gray-800">{selectedGig.city}, {selectedGig.country}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Status</span>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${selectedGig.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : selectedGig.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{selectedGig.status.charAt(0).toUpperCase() + selectedGig.status.slice(1)}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-gray-400 mb-0.5">Created At</span>
                    <span className="text-sm text-gray-500">{new Date(selectedGig.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-6 pb-6">
                <div className="mt-2">
                  <span className="block text-xs font-semibold text-gray-400 mb-1">Description</span>
                  <div className="whitespace-pre-line text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-100 min-h-[48px] text-sm">
                    {selectedGig.description || <span className="text-gray-400">N/A</span>}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end px-6 pb-6">
                <Button onClick={handleCloseModal} variant="outline" className="rounded-full px-6 py-2 text-base font-semibold shadow-sm hover:bg-gray-100 hover:text-emerald-700 transition-all">Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Gig</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this gig? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="deleteReason">Reason for deletion</Label>
              <Input
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Enter reason for deletion..."
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={!deleteReason.trim()}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
