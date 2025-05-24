"use client"

import type React from "react"

import { ArrowRight, Search } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { BannedOverlay } from "@/components/BannedOverlay"
import { SearchAutocomplete } from "@/components/search-autocomplete"
import { ServiceCard } from "@/components/service-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAllSavedGigs } from "@/hooks/use-saved-gigs"
import { useUser, SignInButton } from "@clerk/nextjs"

// Định nghĩa type cho gig
export interface Gig {
  id: number;
  seller_clerk_id: string;
  category_id: number;
  job_type_id: number;
  title: string;
  description: string;
  starting_price: number;
  delivery_time: number;
  gig_image?: string;
  city?: string;
  country?: string;
  status: string;
  gig_images?: string[];
  seller?: {
    name: string;
    avatar: string;
    level: string;
  };
}

// Component Card hiển thị từng gig
function GigCard({ gig }: { gig: Gig }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hovered, setHovered] = useState(false);

  const mediaList = Array.isArray(gig.gig_images) && gig.gig_images.length > 0
    ? gig.gig_images
    : gig.gig_image
    ? [gig.gig_image]
    : ["/placeholder.svg"];

  const currentMedia = mediaList[currentIndex];
  const isVideo = currentMedia.endsWith(".mp4") || currentMedia.includes("/video/");

  const goNext = () => setCurrentIndex((prev) => (prev + 1) % mediaList.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + mediaList.length) % mediaList.length);

  return (
    <Link href={`/gigs/${gig.id}`}>
      <div
        className="border rounded-lg p-4 hover:shadow-lg transition relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative w-full h-40 overflow-hidden rounded bg-gray-100">
          {isVideo ? (
            <video
              src={currentMedia}
              autoPlay
              muted
              loop
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={currentMedia}
              alt={gig.title}
              className="w-full h-full object-cover"
            />
          )}

          {hovered && mediaList.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  goPrev();
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full px-2 py-1 text-black shadow"
              >
                ◀
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  goNext();
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full px-2 py-1 text-black shadow"
              >
                ▶
              </button>
            </>
          )}
        </div>

        <h3 className="mt-2 font-bold truncate" title={gig.title}>{gig.title}</h3>
        <p className="text-gray-500 text-sm line-clamp-2">{gig.description}</p>
        <div className="flex justify-between items-center mt-2">
          <span className="font-semibold text-emerald-600">{gig.starting_price.toLocaleString()} đ</span>
          <span className="text-xs text-gray-400">{gig.delivery_time} days</span>
        </div>
        <div className="mt-1 text-xs text-gray-400">{gig.city}, {gig.country}</div>
        <div className="mt-1">
          <span className={`badge ${gig.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
            {gig.status}
          </span>
        </div>
      </div>
    </Link>
  );
}


// Sample categories
const categories = [
  {
    id: 1,
    name: "Graphics & Design",
    icon: "/icon/graphic-designer.png?height=100&width=100",
    slug: "graphics-design",
  },
  {
    id: 2,
    name: "Digital Marketing",
    icon: "/icon/content.png?height=100&width=100",
    slug: "digital-marketing",
  },
  {
    id: 3,
    name: "Writing & Translation",
    icon: "/icon/writen.png?height=500&width=500",
    slug: "writing-translation",
  },
  {
    id: 4,
    name: "Video & Animation",
    icon: "/icon/animation.png?height=500&width=500",
    slug: "video-animation",
  },
  {
    id: 5,
    name: "Music & Audio",
    icon: "/icon/music.png?height=500&width=500",
    slug: "music-audio",
  },
  {
    id: 6,
    name: "Programming & Tech",
    icon: "/icon/dev.png?height=500&width=500",
    slug: "programming-tech",
  },
  {
    id: 7,
    name: "Business",
    icon: "/icon/business.png?height=500&width=500",
    slug: "business",
  },
  {
    id: 8,
    name: "Lifestyle",
    icon: "/icon/lifestyle.png?height=500&width=500",
    slug: "lifestyle",
  },
]

// Sample services
const popularServices = [
  {
    id: 1,
    title: "I will design a professional logo for your business",
    price: 25,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "Nguyễn Văn Thuận",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 2 Seller",
    },
    rating: 4.9,
    reviewCount: 156,
    badges: ["top_rated"],
    category: "graphics-design",
    deliveryTime: 1,
    isSaved: true,
  },
  {
    id: 2,
    title: "I will create a stunning website using WordPress",
    price: 95,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "Nguyễn Hồ Ngọc Trúc",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Top Rated",
    },
    rating: 5.0,
    reviewCount: 231,
    category: "programming-tech",
    deliveryTime: 3,
  },
  {
    id: 3,
    title: "I will write SEO-optimized content for your blog",
    price: 45,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "ContentPro",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 1 Seller",
    },
    rating: 4.7,
    reviewCount: 89,
    category: "writing-translation",
    deliveryTime: 2,
    isSaved: true,
  },
  {
    id: 4,
    title: "I will create a professional video intro for your brand",
    price: 75,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "VideoWizard",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 2 Seller",
    },
    rating: 4.8,
    reviewCount: 124,
    badges: ["new"],
    category: "video-animation",
    deliveryTime: 5,
  },
]

// Sample testimonials
const testimonials = [
  {
    id: 1,
    name: "Nguyễn Văn Thuận",
    role: "Marketing Director",
    company: "TechStart Inc.",
    avatar: "/avatar/thuan.jpg?height=60&width=60",
    content:
      "Tôi đã sử dụng nền tảng này hơn một năm rồi, và chất lượng công việc mà tôi nhận được luôn ở mức xuất sắc. Các freelancer ở đây rất chuyên nghiệp và luôn hoàn thành đúng hạn.",
    rating: 5,
  },
  {
    id: 2,
    name: "Nguyễn Hồ Ngọc Trúc",
    role: "Entrepreneur",
    company: "GrowFast",
    avatar: "/avatar/truc.jpg?height=60&width=60",
    content:
      "Là một nhà sáng lập startup, tôi nghĩ mình cần những sản phẩm chất lượng với ngân sách khá hạn chế. Nền tảng này đã kết nối tôi với những freelancer tài năng, hiểu đúng tầm nhìn & mong muốn của tôi và mang lại kết quả vượt ngoài mong đợi.",
    rating: 4,
  },
  {
    id: 3,
    name: "Trần Văn Thắng",
    role: "Creative Director",
    company: "DesignHub",
    avatar: "/avatar/thang.jpg?height=60&width=60",
    content:
      "Nền tảng này sở hữu một nguồn nhân lực sáng tạo vô cùng ấn tượng. Chúng tôi đã tìm được những nhà thiết kế nắm bắt hoàn hảo phong cách thương hiệu chúng tôi cần và những cây viết thể hiện tiếng nói của chúng tôi một cách chính xác.",
    rating: 5,
  },
]

// Recently viewed services
const recentlyViewed = [
  {
    id: 5,
    title: "I will design social media graphics for your brand",
    price: 35,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "SocialDesigner",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 1 Seller",
    },
    rating: 4.6,
    reviewCount: 78,
    category: "graphics-design",
    deliveryTime: 2,
    viewedAt: "2 hours ago",
  },
  {
    id: 6,
    title: "I will create a custom WordPress theme for your website",
    price: 120,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "ThemeDeveloper",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Top Rated",
    },
    rating: 4.9,
    reviewCount: 112,
    badges: ["pro"],
    category: "programming-tech",
    deliveryTime: 7,
    viewedAt: "Yesterday",
  },
  {
    id: 7,
    title: "I will create a digital marketing strategy for your business",
    price: 150,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "MarketingGuru",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Top Rated",
    },
    rating: 4.9,
    reviewCount: 87,
    category: "digital-marketing",
    deliveryTime: 5,
    viewedAt: "3 days ago",
  },
]

// Recommended services
const recommendedServices = [
  {
    id: 8,
    title: "I will translate your content from English to Spanish",
    price: 30,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "TranslationPro",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 1 Seller",
    },
    rating: 4.7,
    reviewCount: 65,
    category: "writing-translation",
    deliveryTime: 3,
  },
  {
    id: 9,
    title: "I will compose original music for your project",
    price: 80,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "MusicMaestro",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "New Seller",
    },
    rating: 4.5,
    reviewCount: 23,
    category: "music-audio",
    deliveryTime: 4,
  },
  {
    id: 10,
    title: "I will create a mobile app for your business",
    price: 250,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "AppDeveloper",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Top Rated",
    },
    rating: 4.9,
    reviewCount: 78,
    category: "programming-tech",
    deliveryTime: 14,
    badges: ["pro"],
  },
  {
    id: 11,
    title: "I will design a professional business card",
    price: 15,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "CardDesigner",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 2 Seller",
    },
    rating: 4.8,
    reviewCount: 112,
    category: "graphics-design",
    deliveryTime: 1,
  },
]

// Trending services
const trendingServices = [
  {
    id: 12,
    title: "I will create AI-generated art for your project",
    price: 40,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "AIArtist",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 2 Seller",
    },
    rating: 4.9,
    reviewCount: 87,
    category: "graphics-design",
    deliveryTime: 2,
    badges: ["trending"],
  },
  {
    id: 13,
    title: "I will optimize your website for SEO",
    price: 75,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "SEOmaster",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Top Rated",
    },
    rating: 5.0,
    reviewCount: 156,
    category: "digital-marketing",
    deliveryTime: 5,
    badges: ["trending"],
  },
  {
    id: 14,
    title: "I will create a TikTok marketing strategy",
    price: 60,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "TikTokPro",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 1 Seller",
    },
    rating: 4.7,
    reviewCount: 42,
    category: "digital-marketing",
    deliveryTime: 3,
    badges: ["trending"],
  },
  {
    id: 15,
    title: "I will create a 3D product animation",
    price: 120,
    image: "/placeholder.svg?height=200&width=300",
    seller: {
      name: "3DAnimator",
      avatar: "/placeholder.svg?height=40&width=40",
      level: "Level 2 Seller",
    },
    rating: 4.8,
    reviewCount: 93,
    category: "video-animation",
    deliveryTime: 7,
    badges: ["trending"],
  },
]

// AnimatedWords: Hiện từng từ một, gọi onDone khi xong
function AnimatedWords({ text, className, onDone }: { text: string, className?: string, onDone?: () => void }) {
  const words = text.split(" ");
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < words.length) {
      const timeout = setTimeout(() => setVisibleCount(visibleCount + 1), 180);
      return () => clearTimeout(timeout);
    } else if (visibleCount === words.length && onDone) {
      onDone();
    }
  }, [visibleCount, words.length, onDone]);

  return (
    <span className={className}>
      {words.slice(0, visibleCount).join(" ")}
      <span className="opacity-0">{words.slice(visibleCount).join(" ")}</span>
    </span>
  );
}

// Mapping gig thật sang format ServiceCard
function mapGigToServiceCard(gig: Gig): any {
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
      name: gig.seller?.name || gig.seller_clerk_id || "Người dùng",
      avatar: gig.seller?.avatar || "/placeholder.svg",
      level: "Level 1 Seller",
    },
    rating: 5,
    reviewCount: 0,
    category: gig.category_id?.toString() || "",
    deliveryTime: gig.delivery_time,
    badges: [],
    isSaved: false,
  }
}


export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSub, setShowSub] = useState(false);
  const router = useRouter()
  const [isBanned, setIsBanned] = useState(false);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const savedGigs = useAllSavedGigs();

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Reset trạng thái khi user thay đổi
    setIsBanned(false);
    // Nếu đã đăng nhập, fetch trạng thái banned từ API
    if (isSignedIn && user?.id) {
      fetch(`http://localhost:8800/api/users/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.is_banned !== 'undefined') setIsBanned(!!data.is_banned);
          else setIsBanned(false);
        })
        .catch(() => setIsBanned(false));
    }
  }, [isSignedIn, user?.id]);

  useEffect(() => {
    fetch("http://localhost:8800/api/gigs")
      .then(res => res.json())
      .then(data => {
        console.log('Dữ liệu gigs trả về:', data);
        // Nếu trả về object có gigs
        if (Array.isArray(data.gigs)) setGigs(data.gigs)
        // Nếu trả về mảng trực tiếp
        else if (Array.isArray(data)) setGigs(data)
        // Nếu không đúng định dạng
        else setGigs([])
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  if (isClient && isSignedIn && isBanned) {
    return <BannedOverlay />;
  }

  if (loading) return <div>Loading gigs...</div>;

  const serviceCards = (gigs || []).map(mapGigToServiceCard);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-[500px] text-white overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover z-0"
        >
          <source src="https://res.cloudinary.com/kaleidoscop3/video/upload/v1747545962/video-banner_zjqq2d.mp4.xoacainaylacovideo" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 z-10" />

        {/* Nội dung chữ */}
        <div className="container mx-auto px-4 relative z-20 h-full flex items-center">
          <div className="max-w-3xl">
            {(isClient && isSignedIn) ? (
              <div>
                <h1 className="mb-2 text-4xl font-bold md:text-5xl">
                  <AnimatedWords
                    text={`Welcome back, ${(user?.firstName || '') + (user?.lastName ? ' ' + user.lastName : '') || user?.username || 'User'}!`}
                    onDone={() => setShowSub(true)}
                  />
                </h1>
                {showSub && (
                  <p className="mb-8 text-base md:text-lg opacity-80 text-gray-200">
                    <AnimatedWords
                      text={user?.firstName ? "Manage your platform and help users find the perfect services." : "Find the perfect services for your projects or continue where you left off."}
                    />
                  </p>
                )}
                <div className="flex flex-wrap gap-4">
                  {user?.publicMetadata?.isAdmin ? (
                    <>
                      <Button asChild size="lg" className="bg-white text-emerald-600 hover:bg-gray-100">
                        <Link href="/dashboard/admin">Admin Dashboard</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="border-white text-black hover:bg-white/10">
                        <Link href="/admin/manage-gigs">Manage Services</Link>
                      </Button>
                      <Button asChild size="lg" variant="outline" className="border-white text-black hover:bg-white/10">
                        <Link href="/admin/manage-users">User Manager</Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <SearchAutocomplete
                        placeholder="What service are you looking for today?"
                        className="w-full max-w-xl text-black"
                      />
                      <Button asChild size="lg" variant="outline" className="border-white text-black hover:bg-white/10">
                        <Link href="/saved">View Saved Services</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // Logged out hero content
              <div>
                <h1 className="mb-2 text-4xl font-bold md:text-5xl">
                  Find the perfect freelance services for your business
                </h1>
                <p className="mb-8 text-lg opacity-90">
                  Millions of people use our marketplace to find quality services at affordable prices.
                </p>
                <form onSubmit={handleSearch} className="flex max-w-xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Try 'logo design' or 'website development'"
                      className="h-12 border-0 pl-10 pr-4 text-black"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="ml-2 h-12 bg-gray-900 hover:bg-black">
                    Search
                  </Button>
                </form>
                <div className="mt-4 flex flex-wrap gap-2 text-sm">
                  <span>Popular:</span>
                  {["Website Design", "Logo Design", "WordPress", "Voice Over", "Video Editing"].map((term, index) => (
                    <Button
                      key={index}
                      variant="link"
                      className="rounded-full border border-white/30 px-3 py-1 text-white hover:bg-white/10 hover:text-white font-normal"
                      onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent dark:from-gray-950"></div>
      </section>

      {/* Logged-in specific sections */}
      {isClient && isSignedIn && (
        <>
          {/* Recently Viewed Section */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold dark:text-white">Recently Viewed</h2>
                  <p className="text-gray-600 dark:text-gray-400">Services you've checked out recently</p>
                </div>
                <Button variant="ghost" asChild>
                  <Link href="/search" className="flex items-center gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {recentlyViewed.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          </section>

          {/* Recommended for You Section */}
          <section className="bg-gray-50 py-12 dark:bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">Recommended for You</h2>
                <Button variant="ghost" asChild>
                  <Link href="/search" className="flex items-center gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {serviceCards.slice(0, 4).map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          </section>

          {/* Trending Now Section */}
          <section className="py-12">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">Trending Now</h2>
                <Button variant="ghost" asChild>
                  <Link href="/search" className="flex items-center gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {serviceCards.slice(0, 4).map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          </section>

          {/* Saved Services Section */}
          <section className="bg-gray-50 py-12 dark:bg-gray-900">
            <div className="container mx-auto px-4">
              <div className="mb-8 flex items-center justify-between">
                <h2 className="text-2xl font-bold dark:text-white">Saved Services</h2>
                <Button variant="ghost" asChild>
                  <Link href="/saved" className="flex items-center gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              {savedGigs.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {savedGigs.slice(0, 4).map((gig) => (
                    <ServiceCard key={gig.id} service={mapGigToServiceCard(gig)} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">You don't have any favorite jobs yet.</div>
              )}
            </div>
          </section>
        </>
      )}

      {/* Categories Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-8 text-center text-3xl font-bold dark:text-white">Popular Categories</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/search?category=${category.slug}`}
                className="flex flex-col items-center rounded-lg p-4 text-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <div className="mb-3 rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/20">
                  <Image src={category.icon || "/placeholder.svg"} alt={category.name} width={24} height={24} />
                </div>
                <span className="text-sm font-medium dark:text-white">{category.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Services Section */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-white">Popular Services</h2>
            <Button variant="ghost" asChild>
              <Link href="/search" className="flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {serviceCards.slice(0, 4).map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                showCategory
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-2 text-center text-3xl font-bold dark:text-white">What Our Customers Say</h2>
          <p className="mb-10 text-center text-gray-600 dark:text-gray-400">
            Thousands of satisfied customers have found the perfect freelance services
          </p>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-4 flex items-center gap-4">
                  <Image
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    width={60}
                    height={60}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="font-medium dark:text-white">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testimonial.role}, {testimonial.company}
                    </p>
                  </div>
                </div>
                <div className="mb-4 flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`h-5 w-5 ${
                        i < testimonial.rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300">{testimonial.content}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {isLoaded && !isSignedIn && (
        <section className="bg-emerald-500 py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold">Ready to start your project?</h2>
            <p className="mb-8 text-lg opacity-90">
              Join thousands of satisfied customers who have found the perfect freelance services
            </p>
            <SignInButton mode="modal">
              <button className="bg-white text-emerald-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition">
                Get Started
              </button>
            </SignInButton>
          </div>
        </section>
      )}

      
    </main>
  )
}
