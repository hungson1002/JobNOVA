"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Filter, Star, Eye, ChevronLeft, ChevronRight } from "lucide-react"
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

  // Add pagination states
  const PAGE_SIZE = 4;
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filter/search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

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

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredGigs.length / PAGE_SIZE));
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const gigsToShow = filteredGigs.slice(startIdx, startIdx + PAGE_SIZE);

  if (!isClient) {
    return null
  }

  return (
    <div className="container px-4 py-10 max-w-7xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight flex items-center gap-2">
            Top Rate Management
          </h1>
          <p className="text-lg text-gray-500 mt-2">Easily control which services appear in the <span className='font-semibold text-amber-500'>Top Picks</span> section</p>
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
            {gigsToShow.length > 0 ? (
              gigsToShow.map((gig) => (
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
                      size="icon"
                      className="text-emerald-900 hover:text-amber-500"
                      onClick={() => handleView(gig)}
                      aria-label="View Details"
                    >
                      <Eye className="w-5 h-5" />
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        {showModal && selectedGig && (
          <DialogContent className="max-w-5xl min-h-[75vh] w-full max-h-[95vh] overflow-y-auto p-0 rounded-3xl border border-gray-200 bg-white">
            <DialogHeader>
              <DialogTitle className="sr-only">Gig Details</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-8 p-10">
              {/* Info trên */}
              <div className="w-full flex flex-col gap-6">
                {/* Header */}
                <div className="mb-2">
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">{selectedGig.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mb-2 mt-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-700 border border-green-200`}>{selectedGig.status.charAt(0).toUpperCase() + selectedGig.status.slice(1)}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-3 mb-2 mt-4">
                    <div>
                      <span className="block text-xs font-medium text-gray-400 mb-0.5">First Name</span>
                      <span className="text-sm text-gray-800">{selectedGig.seller?.firstname || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-400 mb-0.5">Last Name</span>
                      <span className="text-sm text-gray-800">{selectedGig.seller?.lastname || '-'}</span>
                    </div>
                    <div>
                      <span className="block text-xs font-medium text-gray-400 mb-0.5">Username</span>
                      <span className="text-sm text-gray-800">{selectedGig.seller?.username || '-'}</span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Clerk ID</span>
                    {selectedGig.seller_clerk_id ? (
                      <span className="text-sm text-gray-800 max-w-xs truncate inline-block align-middle">{selectedGig.seller_clerk_id}</span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>
                </div>
                {/* Info grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Category</span>
                    <span className="text-sm text-gray-800">{selectedGig.category?.name}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Job Type</span>
                    <span className="text-sm text-gray-800">{selectedGig.job_type?.job_type}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Price</span>
                    <span className="text-base font-bold text-gray-900">${selectedGig.starting_price}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Delivery Time</span>
                    <span className="text-sm text-gray-800">{selectedGig.delivery_time} days</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Location</span>
                    <span className="text-sm text-gray-800">{selectedGig.city}, {selectedGig.country}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-medium text-gray-400 mb-0.5">Created At</span>
                    <span className="text-sm text-gray-800">{new Date(selectedGig.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                {/* Description */}
                <div>
                  <span className="block text-xs font-medium text-gray-400 mb-1">Description</span>
                  <div className="whitespace-pre-line text-gray-700 bg-gray-50 rounded-lg p-4 border border-gray-100 min-h-[48px] text-sm">
                    {selectedGig.description || <span className="text-gray-400">N/A</span>}
                  </div>
                </div>
              </div>
              {/* Carousel media dưới cùng */}
              <div className="w-full flex flex-col items-center gap-2 mt-4">
                <GigMediaCarousel media={selectedGig.gig_images && selectedGig.gig_images.length > 0 ? selectedGig.gig_images : selectedGig.gig_image ? [selectedGig.gig_image] : []} />
              </div>
              {/* Footer */}
              <div className="flex justify-end mt-2">
                <Button onClick={handleCloseModal} variant="outline" className="rounded-full px-7 py-2 text-base font-semibold border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 transition-all">Close</Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

// Carousel media cho gig (copy từ manage-gigs nếu chưa có)
function GigMediaCarousel({ media }: { media: string[] }) {
  const [current, setCurrent] = useState(0);
  if (!media || media.length === 0) {
    return <div className="w-full h-96 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 text-gray-400">No Image</div>;
  }
  const prev = () => setCurrent((c) => (c - 1 + media.length) % media.length);
  const next = () => setCurrent((c) => (c + 1) % media.length);
  return (
    <div className="relative w-full flex flex-col items-center">
      <div className="flex items-center justify-center w-full gap-2">
        {/* Nút prev */}
        <button onClick={prev} className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100 disabled:opacity-50" disabled={media.length < 2} aria-label="Previous">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
        </button>
        {/* Ảnh/video chính */}
        <div className="w-full h-96 flex items-center justify-center relative overflow-hidden">
          {media[current].match(/\.(mp4|mov|avi|wmv)$/i) ? (
            <video src={media[current]} controls className="w-full h-full object-contain rounded-xl bg-gray-100" />
          ) : (
            <img src={media[current]} alt="Gig media" className="w-full h-full object-contain rounded-xl bg-gray-100" />
          )}
          {/* Ảnh preview hai bên */}
          {media.length > 1 && (
            <>
              <div className="absolute left-[-48px] top-1/2 -translate-y-1/2 w-32 h-20 opacity-30 overflow-hidden pointer-events-none rounded-xl shadow-md" style={{zIndex:1}}>
                <div className="w-full h-full relative">
                  {media[(current - 1 + media.length) % media.length].match(/\.(mp4|mov|avi|wmv)$/i) ? (
                    <video src={media[(current - 1 + media.length) % media.length]} className="w-full h-full object-cover rounded-xl" muted />
                  ) : (
                    <img src={media[(current - 1 + media.length) % media.length]} alt="Preview left" className="w-full h-full object-cover rounded-xl" />
                  )}
                  <div className="absolute right-0 top-0 w-1/2 h-full bg-white/80" />
                </div>
              </div>
              <div className="absolute right-[-48px] top-1/2 -translate-y-1/2 w-32 h-20 opacity-30 overflow-hidden pointer-events-none rounded-xl shadow-md" style={{zIndex:1}}>
                <div className="w-full h-full relative">
                  {media[(current + 1) % media.length].match(/\.(mp4|mov|avi|wmv)$/i) ? (
                    <video src={media[(current + 1) % media.length]} className="w-full h-full object-cover rounded-xl" muted />
                  ) : (
                    <img src={media[(current + 1) % media.length]} alt="Preview right" className="w-full h-full object-cover rounded-xl" />
                  )}
                  <div className="absolute left-0 top-0 w-1/2 h-full bg-white/80" />
                </div>
              </div>
            </>
          )}
        </div>
        {/* Nút next */}
        <button onClick={next} className="p-2 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-100 disabled:opacity-50" disabled={media.length < 2} aria-label="Next">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      {/* Dots */}
      {media.length > 1 && (
        <div className="flex gap-1 mt-2">
          {media.map((_, idx) => (
            <span key={idx} className={`inline-block w-2 h-2 rounded-full ${idx === current ? 'bg-gray-700' : 'bg-gray-300'}`}></span>
          ))}
        </div>
      )}
    </div>
  );
}

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