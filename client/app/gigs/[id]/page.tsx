"use client"

import { useState, useRef, useEffect } from "react"
import { use } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Star,
  Clock,
  Check,
  Heart,
  Share2,
  Flag,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  ZoomIn,
  X,
  MessageCircle,
  ThumbsUp,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { UserBadge } from "@/components/user-badge"
import { ReportModal } from "@/components/report-modal"
import { ReviewForm } from "@/components/review-form"
import { PriceDisplay } from "@/components/price-display"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { useSavedGigs } from "@/hooks/use-saved-gigs"
import { useUser } from "@clerk/nextjs"

interface PageParams {
  id: string
}

export default function GigDetailPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const gigId = resolvedParams.id
  const { isSaved, isLoading, error, toggleSave } = useSavedGigs(gigId)
  const { user, isSignedIn } = useUser();
  const [reviews, setReviews] = useState<any[]>([]);

  // State for gig thật
  const [gig, setGig] = useState<any>(null)
  const [loadingGig, setLoadingGig] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [reviewSort, setReviewSort] = useState("recent")
  const [reviewsToShow, setReviewsToShow] = useState(3)
  const [filteredReviews, setFilteredReviews] = useState<any[]>([])
  const [expandedFAQs, setExpandedFAQs] = useState<number[]>([])
  const [selectedPackage, setSelectedPackage] = useState("basic")
  const reviewsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setLoadingGig(true)
    fetch(`http://localhost:8800/api/gigs/${gigId}`)
      .then(res => res.json())
      .then(data => setGig(data.gig))
      .finally(() => setLoadingGig(false))
  }, [gigId])

  useEffect(() => {
    // Fetch reviews from backend
    fetch(`http://localhost:8800/api/reviews?gig_id=${gigId}`)
      .then(res => res.json())
      .then(async data => {
        // Map reviewer_clerk_id sang user info nếu backend chưa trả về
        // Giả sử backend trả về mảng reviews, mỗi review có reviewer_clerk_id
        // Nếu backend đã trả về user info thì bỏ đoạn này
        const reviewsWithUser = await Promise.all(
          data.reviews.map(async (review: any) => {
            // Nếu đã có review.user thì giữ nguyên
            if (review.user) return review;
            // Gọi API lấy user info
            const userRes = await fetch(`http://localhost:8800/api/users/${review.reviewer_clerk_id}`);
            const userData = await userRes.json();
            return {
              ...review,
              user: {
                name: userData.name || userData.username || "User",
                avatar: userData.avatar || "/placeholder.svg",
              },
              date: formatTimeAgo(review.created_at),
            };
          })
        );
        setReviews(reviewsWithUser);
      });
  }, [gigId]);

  // Nếu gig có reviews thật, dùng, không thì fallback []
  useEffect(() => {
    if (gig && gig.reviews) setFilteredReviews(gig.reviews)
    else setFilteredReviews([])
  }, [gig])

  // Handle image navigation
  const nextImage = () => {
    if (!gig?.gig_images?.length) return;
    setSelectedImageIndex((prev) => (prev + 1) % gig.gig_images.length)
  }

  const prevImage = () => {
    if (!gig?.gig_images?.length) return;
    setSelectedImageIndex((prev) => (prev - 1 + gig.gig_images.length) % gig.gig_images.length)
  }

  // Handle lightbox navigation
  const openLightbox = (index: number) => {
    if (!gig?.gig_images?.length) return;
    setLightboxIndex(index)
    setIsLightboxOpen(true)
  }

  const nextLightboxImage = () => {
    if (!gig?.gig_images?.length) return;
    setLightboxIndex((prev) => (prev + 1) % gig.gig_images.length)
  }

  const prevLightboxImage = () => {
    if (!gig?.gig_images?.length) return;
    setLightboxIndex((prev) => (prev - 1 + gig.gig_images.length) % gig.gig_images.length)
  }

  // Handle save/favorite
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    toggleSave()
  }

  // Handle share
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: gig.title,
          text: `Check out this gig: ${gig.title}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error))
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href)
      alert("Link copied to clipboard!")
    }
  }

  // Handle FAQ toggle
  const toggleFAQ = (index: number) => {
    setExpandedFAQs((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  // Handle review sorting
  useEffect(() => {
    if (!gig || !gig.reviews) return;
    
    let sorted = [...gig.reviews]

    switch (reviewSort) {
      case "recent":
        // Sort by date (most recent first)
        sorted = sorted.sort((a, b) => {
          const dateA = new Date(
            a.date.includes("week")
              ? Date.now() - Number.parseInt(a.date) * 7 * 24 * 60 * 60 * 1000
              : Date.now() - Number.parseInt(a.date) * 30 * 24 * 60 * 60 * 1000,
          )
          const dateB = new Date(
            b.date.includes("week")
              ? Date.now() - Number.parseInt(b.date) * 7 * 24 * 60 * 60 * 1000
              : Date.now() - Number.parseInt(b.date) * 30 * 24 * 60 * 60 * 1000,
          )
          return dateB.getTime() - dateA.getTime()
        })
        break
      case "highest":
        // Sort by rating (highest first)
        sorted = sorted.sort((a, b) => b.rating - a.rating)
        break
      case "lowest":
        // Sort by rating (lowest first)
        sorted = sorted.sort((a, b) => a.rating - b.rating)
        break
    }

    setFilteredReviews(sorted)
  }, [reviewSort, gig])

  // Hàm format thời gian (ví dụ: 2 weeks ago)
  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} days ago`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)} weeks ago`;
    return `${Math.floor(diff / 2592000)} months ago`;
  }

  // Xử lý submit review
  const handleReviewSubmit = async (data: { rating: number; comment: string }) => {
    if (!isSignedIn || !user) {
      alert("You must be signed in to leave a review.");
      return;
    }
    // Gửi review lên backend
    const res = await fetch("http://localhost:8800/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gig_id: gigId,
        order_id: null, // Nếu có order_id thì truyền vào
        reviewer_clerk_id: user.id,
        rating: data.rating,
        comment: data.comment,
      }),
    });
    const result = await res.json();
    if (result.success) {
      // Mapping dữ liệu mới vào danh sách reviews để hiển thị ngay
      setReviews([
        {
          ...result.review,
          user: {
            name: user.firstName + (user.lastName ? " " + user.lastName : "") || user.username || "User",
            avatar: user.imageUrl || "/placeholder.svg",
          },
          date: formatTimeAgo(result.review.created_at),
        },
        ...reviews,
      ]);
    } else {
      alert("Có lỗi xảy ra khi gửi review!");
    }
  };

  // Handle scroll to reviews
  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Handle continue to checkout
  const handleContinue = () => {
    router.push(`/checkout?gig=${resolvedParams.id}&package=${selectedPackage}`)
  }

  // Handle contact seller
  const handleContactSeller = () => {
    router.push(`/messages/${gig.seller.username}`)
  }

  if (loadingGig) return <div>Loading...</div>
  if (!gig) return <div>Gig not found</div>

  // Gallery logic
  const images = gig.gig_images && Array.isArray(gig.gig_images) && gig.gig_images.length > 0
    ? gig.gig_images
    : (gig.gig_image ? [gig.gig_image] : ["/placeholder.svg"]);
  const seller = gig.seller || {
    name: gig.seller_clerk_id || "AlexDesigns",
    username: gig.seller_clerk_id || "alexdesigns",
    avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    level: "Level 2 Seller",
    bio: "I'm a professional graphic designer with over 5 years of experience specializing in logo design and brand identity. I've worked with clients from various industries, from startups to established businesses, helping them create memorable visual identities."
  }
  const faqs = gig.faqs || [
    {
      question: "How many revisions do I get?",
      answer: "The number of revisions depends on the package you choose. Basic includes 2 revisions, Standard includes unlimited revisions, and Premium includes unlimited revisions plus priority support."
    },
    {
      question: "What file formats will I receive?",
      answer: "You'll receive your logo in multiple formats including PNG, JPG, SVG, and AI (for Standard and Premium packages). All packages include high-resolution files suitable for both print and digital use."
    }
  ]
  const packages = gig.packages || {
    basic: {
      price: gig.starting_price || 25,
      description: "1 professional logo design with 2 revisions",
      deliveryTime: gig.delivery_time || "2",
      features: [
        "1 concept included",
        "Logo transparency",
        "Vector file (SVG)",
        "High resolution files",
        "2 revisions"
      ]
    },
    standard: {
      price: (gig.starting_price || 25) * 2,
      description: "3 professional logo designs with unlimited revisions",
      deliveryTime: (Number(gig.delivery_time) || 2) + 1,
      features: [
        "3 concepts included",
        "Logo transparency",
        "Vector file (SVG, EPS, AI)",
        "High resolution files",
        "Source file",
        "Unlimited revisions",
        "Social media kit"
      ]
    },
    premium: {
      price: (gig.starting_price || 25) * 4,
      description: "5 professional logo designs with priority support",
      deliveryTime: (Number(gig.delivery_time) || 2) + 3,
      features: [
        "5 concepts included",
        "Logo transparency",
        "Vector file (SVG, EPS, AI)",
        "High resolution files",
        "Source file",
        "Unlimited revisions",
        "Social media kit",
        "Stationery designs",
        "3D mockup",
        "Priority support"
      ]
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex text-sm text-gray-500" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link href="/" className="hover:text-emerald-600 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <Link href="/search" className="hover:text-emerald-600 transition-colors">
                    Search
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <span className="mx-2">/</span>
                  <span className="max-w-[200px] truncate">{gig.title}</span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Gig Details */}
          <div className="lg:col-span-2">
            <h1 className="mb-6 text-2xl font-bold md:text-3xl">{gig.title}</h1>

            {/* Seller Brief */}
            <div className="mb-8 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-200">
                <Image
                  src={seller.avatar}
                  alt={seller.name}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <Link
                  href={`/users/${seller.username}`}
                  className="font-medium hover:text-emerald-600 transition-colors"
                >
                  {seller.name}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <UserBadge level={seller.level} />
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-medium">4.9</span>
                    <button
                      onClick={scrollToReviews}
                      className="ml-1 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      (156)
                    </button>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600">3 orders</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleContactSeller}
                className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
              >
                Contact Me
              </Button>
            </div>

            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 group">
                {images[selectedImageIndex].match(/\.(mp4|mov|avi|wmv)$/i) ? (
                  <video
                    src={images[selectedImageIndex]}
                    controls
                    className="w-full h-full object-cover rounded-lg cursor-pointer"
                    style={{height: '100%', width: '100%'}}
                    onClick={() => setIsLightboxOpen(true)}
                  />
                ) : (
                <Image
                  src={images[selectedImageIndex]}
                  alt={gig.title}
                  fill
                    className="object-cover cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                />
                )}
                {images.length > 1 && (
                  <>
                <button
                  onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white transition-colors z-10"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 hover:bg-white transition-colors z-10"
                >
                  <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setIsLightboxOpen(true)}
                  className="absolute bottom-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10"
                  title="Xem lớn"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </div>
              {/* Slider thumbnail */}
              {images.length > 1 && (
              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {images.map((media: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                      className={`relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                      selectedImageIndex === index ? "border-emerald-500" : "border-transparent"
                    }`}
                  >
                      {media.match(/\.(mp4|mov|avi|wmv)$/i) ? (
                        <video src={media} className="object-cover w-full h-full" />
                      ) : (
                        <Image src={media} alt={`${gig.title} - Image ${index + 1}`} fill className="object-cover" />
                      )}
                  </button>
                ))}
              </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">About This Gig</h2>
              <div className="prose max-w-none">
                <p>{gig.description}</p>
              </div>
            </div>

            {/* About The Seller */}
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">About The Seller</h2>
              <div className="prose max-w-none">
                <p>{seller.bio}</p>
              </div>
            </div>

            {/* FAQ */}
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">FAQ</h2>
              <div className="space-y-4">
                {faqs.map((faq: any, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span className="font-medium">{faq.question}</span>
                      {expandedFAQs.includes(index) ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                    {expandedFAQs.includes(index) && (
                      <p className="mt-2 text-gray-600">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Requirements */}
            {gig.requirements && Array.isArray(gig.requirements) && gig.requirements.length > 0 && (
              <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Requirements</h2>
                <ul className="list-disc pl-6 space-y-2">
                  {gig.requirements.map((req: any, idx: number) => (
                    <li key={idx} className="text-gray-700">
                      {req.requirement_text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviews */}
            <div ref={reviewsRef} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Reviews</h2>
                <Select value={reviewSort} onValueChange={setReviewSort}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="highest">Highest Rated</SelectItem>
                    <SelectItem value="lowest">Lowest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-6">
                {reviews.slice(0, reviewsToShow).map((review: any, index: number) => (
                  <div key={index} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                    <div className="mb-2 flex items-center gap-4">
                      <div className="h-10 w-10 overflow-hidden rounded-full">
                        <Image
                          src={review.user.avatar}
                          alt={review.user.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{review.user.name}</div>
                        <div className="flex items-center text-sm text-gray-500">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                          <span className="mx-2">•</span>
                          <span>{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>

              {reviewsToShow < reviews.length && (
                <Button
                  variant="outline"
                  className="mt-6 w-full hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  onClick={() => setReviewsToShow((prev) => prev + 3)}
                >
                  Show More Reviews
                </Button>
              )}

              <div className="mt-6">
                <ReviewForm onSubmit={handleReviewSubmit} />
              </div>
            </div>
          </div>

          {/* Right Column - Packages */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <Tabs value={selectedPackage} onValueChange={setSelectedPackage} className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="standard">Standard</TabsTrigger>
                  <TabsTrigger value="premium">Premium</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold">
                      <PriceDisplay priceUSD={packages.basic.price} />
                    </h3>
                    <span className="text-sm text-gray-500">{packages.basic.deliveryTime} days delivery</span>
                  </div>

                  <ul className="space-y-3">
                    {packages.basic.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handleContinue}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  >
                    Continue
                  </Button>
                </TabsContent>

                <TabsContent value="standard" className="space-y-6">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold">
                      <PriceDisplay priceUSD={packages.standard.price} />
                    </h3>
                    <span className="text-sm text-gray-500">{packages.standard.deliveryTime} days delivery</span>
                  </div>

                  <ul className="space-y-3">
                    {packages.standard.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handleContinue}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  >
                    Continue
                  </Button>
                </TabsContent>

                <TabsContent value="premium" className="space-y-6">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-2xl font-bold">
                      <PriceDisplay priceUSD={packages.premium.price} />
                    </h3>
                    <span className="text-sm text-gray-500">{packages.premium.deliveryTime} days delivery</span>
                  </div>

                  <ul className="space-y-3">
                    {packages.premium.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={handleContinue}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 transition-colors"
                  >
                    Continue
                  </Button>
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  disabled={isLoading}
                >
                  <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    >
                      <Flag className="mr-2 h-4 w-4" />
                      Report
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Report This Gig</DialogTitle>
                      <DialogDescription>
                        Please let us know why you want to report this gig. We'll review your report and take
                        appropriate action.
                      </DialogDescription>
                    </DialogHeader>
                    <ReportModal 
                      type="service"
                      id={resolvedParams.id}
                      name={gig.title}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={prevLightboxImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-6 w-6 text-white" />
          </button>
          <button
            onClick={nextLightboxImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-6 w-6 text-white" />
          </button>
          <div className="relative h-[80vh] w-[80vw] flex items-center justify-center">
            {images[lightboxIndex].match(/\.(mp4|mov|avi|wmv)$/i) ? (
              <video
                src={images[lightboxIndex]}
                controls
                autoPlay
                className="max-h-[80vh] max-w-[80vw] rounded-lg"
                style={{background: '#222'}}
              />
            ) : (
            <Image
              src={images[lightboxIndex]}
              alt={gig.title}
              fill
              className="object-contain"
            />
            )}
          </div>
        </div>
      )}
    </main>
  )
}
