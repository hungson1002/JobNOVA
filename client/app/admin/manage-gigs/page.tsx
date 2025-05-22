"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle, XCircle, Search, Filter, Eye } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"

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
      toast({
        title: "Error",
        description: "Failed to fetch gigs",
        variant: "destructive",
      });
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
      const response = await fetch(`http://localhost:8800/api/gigs/${gigId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "active" }),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Gig has been approved",
        });
        setGigs(prev => prev.filter(gig => gig.id !== gigId));
        fetchCounts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve gig",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (gigId: number) => {
    try {
      const response = await fetch(`http://localhost:8800/api/gigs/${gigId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "rejected" }),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Gig has been rejected",
        });
        setGigs(prev => prev.filter(gig => gig.id !== gigId));
        fetchCounts();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject gig",
        variant: "destructive",
      });
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

  if (!isClient) {
    return null
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Manage Gigs</h1>
        <p className="text-muted-foreground">Review, approve, and manage gigs on the platform</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gig Management</CardTitle>
          <CardDescription>Review and manage all gigs on the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or seller..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Graphics & Design">Graphics & Design</SelectItem>
                  <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                  <SelectItem value="Writing & Translation">Writing & Translation</SelectItem>
                  <SelectItem value="Video & Animation">Video & Animation</SelectItem>
                  <SelectItem value="Programming & Tech">Programming & Tech</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs value={tab} onValueChange={handleTabChange} defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending">
                Pending
                <Badge variant="secondary" className="ml-2">
                  {counts.pending}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved
                <Badge variant="secondary" className="ml-2">
                  {counts.approved}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected">
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
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Submitted Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tab === "pending" && displayedGigs.length > 0 ? (
                    displayedGigs.map((gig) => (
                      <TableRow key={gig.id}>
                        <TableCell className="font-medium">{gig.title}</TableCell>
                        <TableCell>{gig.seller_clerk_id}</TableCell>
                        <TableCell>{gig.category?.name}</TableCell>
                        <TableCell>{gig.job_type?.job_type}</TableCell>
                        <TableCell>${gig.starting_price}</TableCell>
                        <TableCell>{gig.delivery_time} days</TableCell>
                        <TableCell>{gig.city}, {gig.country}</TableCell>
                        <TableCell>{new Date(gig.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleView(gig)}>
                              <Eye className="h-4 w-4" />
                              <span className="sr-only">View</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-green-500 hover:bg-green-50 hover:text-green-600"
                              onClick={() => handleApprove(gig.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span className="sr-only">Approve</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleReject(gig.id)}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only">Reject</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
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
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tab === "approved" && displayedGigs.length > 0 ? (
                    displayedGigs.map((gig) => (
                      <TableRow key={gig.id}>
                        <TableCell className="font-medium">{gig.title}</TableCell>
                        <TableCell>{gig.seller_clerk_id}</TableCell>
                        <TableCell>{gig.category?.name}</TableCell>
                        <TableCell>{gig.job_type?.job_type}</TableCell>
                        <TableCell>${gig.starting_price}</TableCell>
                        <TableCell>{gig.delivery_time} days</TableCell>
                        <TableCell>{gig.city}, {gig.country}</TableCell>
                        <TableCell>
                          <Badge variant="default">Active</Badge>
                        </TableCell>
                        <TableCell>{new Date(gig.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleView(gig)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center">
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
                    <TableHead>Title</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Job Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Rejected Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tab === "rejected" && displayedGigs.length > 0 ? (
                    displayedGigs.map((gig) => (
                      <TableRow key={gig.id}>
                        <TableCell className="font-medium">{gig.title}</TableCell>
                        <TableCell>{gig.seller_clerk_id}</TableCell>
                        <TableCell>{gig.category?.name}</TableCell>
                        <TableCell>{gig.job_type?.job_type}</TableCell>
                        <TableCell>${gig.starting_price}</TableCell>
                        <TableCell>{gig.delivery_time} days</TableCell>
                        <TableCell>{gig.city}, {gig.country}</TableCell>
                        <TableCell>{new Date(gig.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleView(gig)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center">
                        No rejected gigs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal xem chi tiết gig */}
      <Dialog open={showModal} onOpenChange={handleCloseModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Gig Details</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết dịch vụ
            </DialogDescription>
          </DialogHeader>
          {selectedGig && (
            <div className="space-y-2">
              <div><b>Tiêu đề:</b> {selectedGig.title}</div>
              <div><b>Mô tả:</b> {selectedGig.description}</div>
              <div><b>Người bán:</b> {selectedGig.seller_clerk_id}</div>
              <div><b>Danh mục:</b> {selectedGig.category?.name}</div>
              <div><b>Loại công việc:</b> {selectedGig.job_type?.job_type}</div>
              <div><b>Giá:</b> ${selectedGig.starting_price}</div>
              <div><b>Thời gian giao:</b> {selectedGig.delivery_time} ngày</div>
              <div><b>Vị trí:</b> {selectedGig.city}, {selectedGig.country}</div>
              <div><b>Trạng thái:</b> {selectedGig.status}</div>
              <div><b>Ngày tạo:</b> {new Date(selectedGig.created_at).toLocaleDateString()}</div>
              {selectedGig.gig_image && (
                <div>
                  <b>Ảnh:</b><br />
                  <img src={selectedGig.gig_image} alt="Gig" className="max-w-full max-h-48 rounded border" />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleCloseModal} variant="outline">Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
