"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowLeftCircle, ArrowRightCircle, Bookmark, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/service-card"
import { useAllSavedGigs } from "@/hooks/use-saved-gigs"
import { Input } from "@/components/ui/input"

// Mapping gig thật sang định dạng ServiceCard
function mapGigToServiceCard(gig: any) {
  const mediaList = Array.isArray(gig.gig_images) && gig.gig_images.length > 0
    ? gig.gig_images
    : gig.gig_image
    ? [gig.gig_image]
    : ["/placeholder.svg"];

  let categoryName = "";
  if (typeof gig.category === "string") {
    categoryName = gig.category;
  } else if (typeof gig.category === "object" && gig.category?.name) {
    categoryName = gig.category.name;
  }

  return {
    id: gig.id,
    title: gig.title,
    price: gig.starting_price,
    image: mediaList[0], // Ảnh đầu tiên để hiển thị nhanh
    gig_images: mediaList, // Truyền cả mảng media cho gallery
    seller: {
      id: gig.seller_clerk_id,
      name: gig.seller?.name || gig.seller_clerk_id || "Người dùng",
      avatar: gig.seller?.avatar || "/placeholder.svg",
      level: gig.seller?.level || "Level 1 Seller",
      firstname: gig.seller?.firstname,
      lastname: gig.seller?.lastname,
      username: gig.seller?.username,
    },
    rating: typeof gig.rating === "number" ? gig.rating : 0,
    reviewCount: typeof gig.review_count === "number" ? gig.review_count : 0,
    category: categoryName || "Uncategorized",
    deliveryTime: gig.delivery_time,
    badges: gig.badges || [],
    isSaved: true,
  };
}

const PAGE_SIZE = 10; // 2 rows x 5 items

export default function SavedGigsPage() {
  const savedGigs = useAllSavedGigs();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter gigs based on search query
  const filteredGigs = savedGigs.filter(gig => 
    gig.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    gig.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredGigs.length / PAGE_SIZE)); // At least 1 page
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const gigsToShow = filteredGigs.slice(startIdx, endIdx);

  // Reset to first page when search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Saved Gigs</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {filteredGigs.length} {filteredGigs.length === 1 ? 'service' : 'services'} saved
                </p>
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search saved services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4"
              />
            </div>
          </div>
        </div>

        {filteredGigs.length > 0 ? (
          <>
            {/* Grid Layout - 5 items per row, 2 rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {gigsToShow.map((gig) => (
                <ServiceCard
                  key={gig.id}
                  service={mapGigToServiceCard(gig)}
                  showCategory
                />
              ))}
              {/* Add empty placeholders to maintain grid layout */}
              {gigsToShow.length < PAGE_SIZE && 
                Array.from({ length: PAGE_SIZE - gigsToShow.length }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="hidden xl:block" />
                ))
              }
            </div>

            {/* Always show Pagination */}
            <div className="mt-12 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="h-10 w-10 rounded-full"
                >
                  <ArrowLeftCircle className="h-5 w-5" />
                </Button>

                <div className="flex items-center">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5) {
                      if (currentPage > 3) {
                        pageNum = currentPage - 3 + i;
                      }
                      if (currentPage > totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      }
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="icon"
                        className={`h-10 w-10 rounded-full mx-1 ${
                          currentPage === pageNum 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                            : "hover:bg-gray-50"
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="mx-2">...</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  className="h-10 w-10 rounded-full"
                >
                  <ArrowRightCircle className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex flex-col items-center gap-1">
                <p className="text-sm text-gray-500">
                  Showing {startIdx + 1}-{Math.min(endIdx, filteredGigs.length)} of {filteredGigs.length} results
                </p>
                <p className="text-xs text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="mb-4">
              <Bookmark className="h-12 w-12 mx-auto text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No saved services found</h2>
            <p className="text-gray-500 mb-6">
              {searchQuery 
                ? "No services match your search criteria" 
                : "Start saving services you're interested in"}
            </p>
            <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
              <Link href="/">Browse Services</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
