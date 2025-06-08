"use client"

import { PriceDisplay } from "@/components/price-display"
import { useSavedGigs } from "@/hooks/use-saved-gigs"
import { useUser, SignInButton } from "@clerk/nextjs"
import { Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type React from "react"
import { useRef, useState, useEffect } from "react"
import { toast } from "sonner"
import io from "socket.io-client"

interface ServiceCardProps {
  service: {
    id: string | number
    title: string
    price: number
    image: string
    gig_images?: string[]
    seller: {
      name: string
      avatar: string
      firstname?: string
      lastname?: string
      username?: string
    }
    rating: number
    reviewCount: number
    badges?: string[]
    category?: string
    deliveryTime?: number
  }
  showCategory?: boolean
}

const socket = io("http://localhost:8800")

export function ServiceCard({ service, showCategory = false }: ServiceCardProps) {
  const { user } = useUser()
  const isLoggedIn = !!user
  const { isSaved, isLoading, toggleSave } = useSavedGigs(service.id)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [sellerOnline, setSellerOnline] = useState(false)
  const sellerId = (service.seller as any).id || service.seller.name || service.seller.avatar

  const mediaList = service.gig_images && service.gig_images.length > 0 ? service.gig_images : [service.image]
  const currentMedia = mediaList[currentIndex]
  const isVideo = typeof currentMedia === "string" && (currentMedia.endsWith(".mp4") || currentMedia.includes("/video/"))

  useEffect(() => {
    if (!sellerId) return
    function handleOnline({ userId }: { userId: string }) {
      if (userId === sellerId) setSellerOnline(true)
    }
    function handleOffline({ userId }: { userId: string }) {
      if (userId === sellerId) setSellerOnline(false)
    }
    socket.on("userOnline", handleOnline)
    socket.on("userOffline", handleOffline)
    socket.emit("checkOnline", { userId: sellerId }, (isOnline: boolean) => setSellerOnline(isOnline))
    return () => {
      socket.off("userOnline", handleOnline)
      socket.off("userOffline", handleOffline)
    }
  }, [sellerId])

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isLoggedIn) {
      toggleSave()
      if (!isSaved) {
        toast.success("Added to favorites", {
          description: "Service has been added to your favorites list"
        })
      } else {
        toast.success("Removed from favorites", {
          description: "Service has been removed from your favorites list"
        })
      }
    }
  }

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % mediaList.length)
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length)

  return (
    <Link href={`/gigs/${service.id}`} className="block w-full sm:w-[250px]">
      <div
        className="group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-200/50 bg-white transition-all duration-300  hover:shadow-xl hover:shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:hover:shadow-gray-900/30"
        onMouseEnter={() => {
          setHovered(true)
          if (videoRef.current) videoRef.current.play()
        }}
        onMouseLeave={() => {
          setHovered(false)
          if (videoRef.current) videoRef.current.pause()
        }}
      >
        {/* Glass effect overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Media */}
        <div className="relative h-[140px] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentMedia}
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <Image
              src={currentMedia || "/placeholder.svg"}
              alt={service.title}
              fill
              className="object-cover"
            />
          )}

          {/* Navigation buttons */}
          {mediaList.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goPrev()
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 w-8 h-8 flex items-center justify-center text-gray-700 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100 dark:bg-gray-900/90 dark:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goNext()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 w-8 h-8 flex items-center justify-center text-gray-700 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-110 opacity-0 group-hover:opacity-100 dark:bg-gray-900/90 dark:text-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </>
          )}

          {/* Save button */}
          {isLoggedIn ? (
            <button
              onClick={handleSaveClick}
              className={`absolute right-2 top-2 rounded-full p-1.5 z-10 transition-all duration-300 ${
                isSaved
                  ? "bg-red-50/95 text-red-500 shadow-lg shadow-red-500/20 dark:bg-red-500/20 dark:text-red-400"
                  : "bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 dark:bg-gray-900/90 dark:text-gray-400 dark:hover:text-red-400"
              }`}
              aria-label={isSaved ? "Remove from saved" : "Save gig"}
              tabIndex={0}
              disabled={isLoading}
            >
              <Heart className={`h-4 w-4 transition-all duration-300 ${isSaved ? "fill-current" : ""}`} />
            </button>
          ) : (
            <SignInButton mode="modal">
              <button
                className="absolute right-2 top-2 rounded-full p-1.5 z-10 bg-white/90 text-gray-600 hover:bg-white hover:text-red-500 transition-all duration-300 dark:bg-gray-900/90 dark:text-gray-400 dark:hover:text-red-400"
                aria-label="Save gig (login required)"
                tabIndex={0}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Heart className="h-4 w-4 transition-all duration-300" />
              </button>
            </SignInButton>
          )}

          {/* Badges */}
          {service.badges && service.badges.length > 0 && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1.5">
              {service.badges.includes("top_rated") && (
                <span className="animate-bounce duration-[10000ms] rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg backdrop-blur-sm">
                  🔥 Top Rated
                </span>
              )}
              {service.badges?.includes("new") && (
                <span className="rounded-full bg-gradient-to-r from-emerald-500 to-green-500 px-2 py-0.5 text-[10px] font-medium text-white shadow-lg backdrop-blur-sm animate-pulse">
                  🟢 New
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-3">
          <div className="mb-2 flex items-center gap-2">
            <div className="relative">
              <div className="relative h-6 w-6 overflow-hidden rounded-full ring-2 ring-white ring-offset-1 dark:ring-gray-800">
                <Image
                  src={service.seller.avatar || "/placeholder.svg"}
                  alt={
                    service.seller.name ||
                    service.seller.username ||
                    [service.seller.firstname, service.seller.lastname].filter(Boolean).join(" ") ||
                    "Seller Avatar"
                  }
                  width={24}
                  height={24}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
              {(() => {
                const seller = service.seller as any;
                if (seller.firstname || seller.lastname) {
                  return `${seller.firstname || ''} ${seller.lastname || ''}`.trim();
                } else if (seller.username) {
                  return seller.username;
                } else if (seller.name) {
                  return seller.name;
                } else if (seller.id) {
                  return seller.id;
                } else {
                  return "User";
                }
              })()}
            </span>
          </div>

          <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-white">
            {service.title}
          </h3>

          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex items-center">
              <svg className="h-3.5 w-3.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="ml-0.5 text-xs font-semibold text-gray-900 dark:text-white">{service.rating.toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">({service.reviewCount} reviews)</span>
          </div>

          {showCategory && service.category && (
            <div className="mb-4">
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                {service.category.replace("-", " ")}
              </span>
            </div>
          )}

          {service.deliveryTime && (
            <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Delivery in {service.deliveryTime} day{service.deliveryTime > 1 ? "s" : ""}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-2 dark:border-gray-800">
            <div className="text-[10px] font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Starting at</div>
            <PriceDisplay 
              priceUSD={service.price} 
              className="text-sm font-bold text-gray-900 dark:text-white" 
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
