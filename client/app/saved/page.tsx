"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowLeftCircle, ArrowRightCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ServiceCard } from "@/components/service-card"
import { useAllSavedGigs } from "@/hooks/use-saved-gigs"

// Mapping gig thật sang định dạng ServiceCard
function mapGigToServiceCard(gig: any) {
  const mediaList = Array.isArray(gig.gig_images) && gig.gig_images.length > 0
    ? gig.gig_images
    : gig.gig_image
    ? [gig.gig_image]
    : ["/placeholder.svg"];
  return {
    id: gig.id,
    title: gig.title,
    price: gig.starting_price,
    image: mediaList[0], // Ảnh đầu tiên để hiển thị nhanh
    gig_images: mediaList, // Truyền cả mảng media cho gallery
    seller: {
      name: gig.seller_clerk_id,
      avatar: "/placeholder.svg",
      level: "Level 1 Seller",
    },
    rating: 5,
    reviewCount: 0,
    category: gig.category_id?.toString() || "",
    deliveryTime: gig.delivery_time,
    badges: [],
    isSaved: true,
  };
}

const PAGE_SIZE = 12;

export default function SavedGigsPage() {
  const savedGigs = useAllSavedGigs();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(savedGigs.length / PAGE_SIZE);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const gigsToShow = savedGigs.slice(startIdx, endIdx);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/dashboard" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Saved Gigs</h1>
      </div>

      {savedGigs.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {gigsToShow.map((gig) => (
              <ServiceCard
                key={gig.id}
                service={mapGigToServiceCard(gig)}
              />
            ))}
            {/* Thêm placeholder để đủ 12 ô */}
            {Array.from({ length: PAGE_SIZE - gigsToShow.length }).map((_, idx) => (
              <div key={`empty-${idx}`} className="invisible" />
            ))}
          </div>
          {/* Pagination luôn hiển thị */}
          <div className="flex justify-center items-center gap-1 mt-8">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="h-9 w-9"
              aria-label="Previous page"
            >
              <ArrowLeftCircle className="h-5 w-5" />
            </Button>

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
                  size="sm"
                  className={`h-9 w-9 p-0 ${currentPage === pageNum ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400" : ""}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}

            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <Button variant="outline" size="sm" className="h-9 w-9 p-0" disabled>
                  ...
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setCurrentPage(totalPages)}
                >
                  {totalPages}
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="h-9 w-9"
              aria-label="Next page"
            >
              <ArrowRightCircle className="h-5 w-5" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">You haven't saved any gigs yet.</p>
          <Button className="mt-4" asChild>
            <Link href="/">Browse Gigs</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
