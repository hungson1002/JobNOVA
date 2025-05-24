"use client"

import { PriceDisplay } from "@/components/price-display"
import { useSavedGigs } from "@/hooks/use-saved-gigs"
import { useUser, SignInButton } from "@clerk/nextjs"
import { Heart } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type React from "react"
import { useRef, useState } from "react"

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
      level: string
    }
    rating: number
    reviewCount: number
    badges?: string[]
    category?: string
    deliveryTime?: number
  }
  showCategory?: boolean
}

export function ServiceCard({ service, showCategory = false }: ServiceCardProps) {
  const { user } = useUser()
  const isLoggedIn = !!user
  const { isSaved, isLoading, toggleSave } = useSavedGigs(service.id)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hovered, setHovered] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const mediaList = service.gig_images && service.gig_images.length > 0 ? service.gig_images : [service.image]
  const currentMedia = mediaList[currentIndex]
  const isVideo = currentMedia.endsWith(".mp4") || currentMedia.includes("/video/")

  const handleSaveClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isLoggedIn) toggleSave()
  }

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % mediaList.length)
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length)

  return (
    <Link href={`/gigs/${service.id}`} className="block h-full">
      <div
        className="group flex h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
        onMouseEnter={() => {
          setHovered(true)
          if (videoRef.current) videoRef.current.play()
        }}
        onMouseLeave={() => {
          setHovered(false)
          if (videoRef.current) videoRef.current.pause()
        }}
      >
        {/* Media */}
        <div className="relative aspect-video overflow-hidden">
          {isVideo ? (
            <video
              ref={videoRef}
              src={currentMedia}
              muted
              loop
              playsInline
              className="w-full h-full object-cover pointer-events-none"
            />
          ) : (
            <Image
              src={currentMedia || "/placeholder.svg"}
              alt={service.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
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
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-white text-black shadow opacity-0 group-hover:opacity-100 transition duration-300"
              >
                ◀
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  goNext()
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 bg-white text-black shadow opacity-0 group-hover:opacity-100 transition duration-300"
              >
                ▶
              </button>
            </>
          )}

          {/* Save button */}
          {isLoggedIn ? (
            <button
              onClick={handleSaveClick}
              className={`absolute right-3 top-3 rounded-full p-1.5 z-10 transition duration-200
                ${
                  isSaved
                    ? "bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-white/80 text-gray-600 hover:text-red-500 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:text-red-400"
                }`}
              aria-label={isSaved ? "Remove from saved" : "Save gig"}
              tabIndex={0}
              disabled={isLoading}
            >
              <Heart className={`h-5 w-5 transition duration-200 ${isSaved ? "fill-current" : ""}`} />
            </button>
          ) : (
            <SignInButton mode="modal">
              <button
                className="absolute right-3 top-3 rounded-full p-1.5 z-10 bg-white/80 text-gray-600 hover:text-red-500 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:text-red-400 transition duration-200"
                aria-label="Save gig (login required)"
                tabIndex={0}
                onClick={e => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Heart className="h-5 w-5 transition duration-200" />
              </button>
            </SignInButton>
          )}

          {/* Badges */}
          {service.badges && service.badges.length > 0 && (
            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
              {service.badges.includes("top_rated") && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  Top Rated
                </span>
              )}
              {service.badges.includes("pro") && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                  Pro
                </span>
              )}
              {service.badges.includes("new") && (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  New
                </span>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center gap-2">
            <Image
              src={service.seller.avatar || "/placeholder.svg"}
              alt={service.seller.name}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-sm font-medium dark:text-gray-200">{service.seller.name}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">| {service.seller.level}</span>
          </div>

          <h3 className="mb-2 line-clamp-2 text-sm font-medium dark:text-white">{service.title}</h3>

          <div className="mb-2 flex items-center gap-1">
            <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm font-medium dark:text-gray-200">{service.rating.toFixed(1)}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">({service.reviewCount})</span>
          </div>

          {showCategory && service.category && (
            <div className="mb-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                {service.category.replace("-", " ")}
              </span>
            </div>
          )}

          {service.deliveryTime && (
            <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Delivery in {service.deliveryTime} day{service.deliveryTime > 1 ? "s" : ""}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between pt-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">Starting at</div>
            <PriceDisplay priceUSD={service.price} className="text-base font-semibold dark:text-white" />
          </div>
        </div>
      </div>
    </Link>
  )
}
