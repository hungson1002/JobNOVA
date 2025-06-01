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
  isToprate: boolean;
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
        setGigs(data.gigs.map((gig: any) => ({
          ...gig,
          isToprate: Boolean(gig.isToprate),
        })));
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
        body: JSON.stringify({ isToprate: !gig.isToprate }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Gig ${gig.isToprate ? 'removed from' : 'added to'} top rate`);
        setGigs(prev => prev.map(g => 
          g.id === gig.id ? { ...g, isToprate: !g.isToprate } : g
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
    <div className="container px-4 py-10 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight flex items-center gap-2">
            Manage Top Rate Gigs
          </h1>
          <p className="text-lg text-gray-500 mt-2">Easily control which gigs appear in the <span className='font-semibold text-amber-500'>Top Picks</span> section</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full md:w-auto">
          <div className="relative flex-1 w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by title or seller..."
              className="pl-10 rounded-xl shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] rounded-xl shadow-sm">
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
      <div className="rounded-2xl bg-white dark:bg-gray-950 overflow-x-auto border border-gray-100">
        <Table>
          <TableHeader className="bg-emerald-50/60 dark:bg-gray-900">
            <TableRow>
              <TableHead className="text-lg font-semibold text-gray-700">Image</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">Title</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">Seller</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">Category</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">Status</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">Top Rate</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredGigs.length > 0 ? (
              filteredGigs.map((gig) => (
                <TableRow key={gig.id} className="hover:bg-amber-50/40 transition group">
                  <TableCell>
                    {gig.gig_images && gig.gig_images.length > 0 ? (
                      <img src={gig.gig_images[0]} alt="Gig" className="w-20 h-20 object-cover rounded-xl border" />
                    ) : gig.gig_image ? (
                      <img src={gig.gig_image} alt="Gig" className="w-20 h-20 object-cover rounded-xl border" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400 border">No Image</div>
                    )}
                  </TableCell>
                  <TableCell className="font-bold text-lg text-gray-800 group-hover:text-amber-600 max-w-[220px] truncate">
                    <div className="flex items-center gap-2">
                      {gig.isToprate && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full">🔥 Top Rated</span>
                      )}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate cursor-pointer">
                              {gig.title}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <span className="select-all break-all">{gig.title}</span>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="block max-w-[120px] truncate cursor-pointer font-medium text-gray-700">
                            {(() => {
                              const sellerName = gig.seller
                                ? gig.seller.firstname && gig.seller.lastname
                                  ? `${gig.seller.firstname} ${gig.seller.lastname}`
                                  : gig.seller.firstname || gig.seller.lastname || gig.seller.username || gig.seller_clerk_id || "N/A"
                                : gig.seller_clerk_id || "N/A";
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
                  <TableCell className="font-medium text-gray-600">{gig.category?.name}</TableCell>
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
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={gig.isToprate}
                        onCheckedChange={() => handleToggleTopRate(gig)}
                        id={`toprate-switch-${gig.id}`}
                      />
                      <label htmlFor={`toprate-switch-${gig.id}`} className="text-xs font-semibold text-gray-700">
                        {gig.isToprate ? "On" : "Off"}
                      </label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700 hover:text-amber-500 font-semibold"
                      onClick={() => handleView(gig)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-gray-400 text-lg">
                  No gigs found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Gig Detail Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-4xl rounded-2xl border-2 border-amber-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-700">
              Gig Details
            </DialogTitle>
          </DialogHeader>
          {selectedGig && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {selectedGig.gig_images && selectedGig.gig_images.length > 0 ? (
                    selectedGig.gig_images.map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`Gig ${index + 1}`}
                        className="w-full h-48 object-cover rounded-xl border"
                      />
                    ))
                  ) : selectedGig.gig_image ? (
                    <img
                      src={selectedGig.gig_image}
                      alt="Gig"
                      className="w-full h-48 object-cover rounded-xl border"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-xl flex items-center justify-center border">No Image</div>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">Title</h3>
                  <p className="text-lg text-gray-800 font-bold">{selectedGig.title}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">Description</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{selectedGig.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Category</h3>
                    <p className="text-gray-600">{selectedGig.category?.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Job Type</h3>
                    <p className="text-gray-600">{selectedGig.job_type?.job_type}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Starting Price</h3>
                    <p className="text-gray-800 font-semibold">${selectedGig.starting_price}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-700">Delivery Time</h3>
                    <p className="text-gray-600">{selectedGig.delivery_time} days</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2 text-gray-700">Location</h3>
                  <p className="text-gray-600">
                    {selectedGig.city}, {selectedGig.country}
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} className="rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 