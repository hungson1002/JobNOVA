"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Star } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useAuth } from "@clerk/nextjs"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"

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
  is_top_rate: boolean;
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

export default function ManageTopRatePage() {
  const [isClient, setIsClient] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(true)
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchGigs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8800/api/gigs?include=category,job_type&status=active`);
      const data = await response.json();
      if (data.success) {
        setGigs(data.gigs);
      }
    } catch (error) {
      toast.error("Failed to fetch gigs");
    } finally {
      setLoading(false);
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
        toast.error("Failed to fetch categories");
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchGigs();
  }, []);

  const handleView = (gig: Gig) => {
    setSelectedGig(gig);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedGig(null);
  };

  const handleToggleTopRate = async (gig: Gig) => {
    try {
      const token = await getToken();
      const response = await fetch(`http://localhost:8800/api/gigs/${gig.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ is_top_rate: !gig.is_top_rate }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Gig ${gig.is_top_rate ? 'removed from' : 'added to'} top rate`);
        setGigs(prev => prev.map(g => 
          g.id === gig.id ? { ...g, is_top_rate: !g.is_top_rate } : g
        ));
      }
    } catch (error) {
      toast.error("Failed to update top rate status");
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

  if (!isClient) {
    return null
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Manage Top Rate Gigs</h1>
          <p className="text-muted-foreground">Manage which gigs appear in the top rate section</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full md:w-auto">
          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or seller..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
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
      </div>
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Image</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Seller</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Top Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGigs.length > 0 ? (
                filteredGigs.map((gig) => (
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
                        {gig.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={gig.is_top_rate}
                        onCheckedChange={() => handleToggleTopRate(gig)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(gig)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No gigs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Gig Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Gig Details</DialogTitle>
          </DialogHeader>
          {selectedGig && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedGig.gig_images && selectedGig.gig_images.length > 0 ? (
                    selectedGig.gig_images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Gig ${index + 1}`}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    ))
                  ) : selectedGig.gig_image ? (
                    <img
                      src={selectedGig.gig_image}
                      alt="Gig"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                      No Image
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Title</h3>
                  <p className="text-muted-foreground">{selectedGig.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedGig.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Category</h3>
                    <p className="text-muted-foreground">{selectedGig.category?.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Job Type</h3>
                    <p className="text-muted-foreground">{selectedGig.job_type?.job_type}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Starting Price</h3>
                    <p className="text-muted-foreground">${selectedGig.starting_price}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Delivery Time</h3>
                    <p className="text-muted-foreground">{selectedGig.delivery_time} days</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Location</h3>
                  <p className="text-muted-foreground">
                    {selectedGig.city}, {selectedGig.country}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 