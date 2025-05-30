"use client"

import type React from "react"

import { ArrowRight, Search, ChevronLeft, ChevronRight, Bookmark, ShoppingBag, DollarSign, Store } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef } from "react"

import { BannedOverlay } from "@/components/BannedOverlay"
import { SearchAutocomplete } from "@/components/search-autocomplete"
import { ServiceCard } from "@/components/service-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAllSavedGigs } from "@/hooks/use-saved-gigs"
import { SignInButton, useUser, useAuth } from "@clerk/nextjs"
import { PriceDisplay } from "@/components/price-display"

// Định nghĩa type cho gig
export interface Gig {
  id: number;
  seller_clerk_id: string;
  category?: {
    id: number;
    name: string;
  };
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
  badges?: string[];
  seller?: {
    name: string;
    avatar: string;
    level: string;
  };
  rating?: number;
  review_count?: number;
  created_at: string;
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

// AnimatedWords: Hiện từng từ một, gọi onDone khi xong
function AnimatedWords({ text, className = "", onDone }: { text: string, className?: string, onDone?: () => void }) {
  const words = text.split(" ");
  const [visibleCount, setVisibleCount] = useState<number>(0);

  useEffect(() => {
    if (visibleCount < words.length) {
      const timer = setTimeout(() => {
        setVisibleCount((prev: number) => prev + 1);
      }, 100);
      return () => clearTimeout(timer);
    } else if (onDone) {
      onDone();
    }
  }, [visibleCount, words.length, onDone]);

  return (
    <span className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className={`inline transition-opacity duration-200 ${
            i < visibleCount ? "opacity-100" : "opacity-0"
          }`}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
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
    image: mediaList[0],
    gig_images: mediaList,
    seller: {
      name: gig.seller?.name || gig.seller_clerk_id || "Người dùng",
      avatar: gig.seller?.avatar || "/placeholder.svg",
    },
    rating: typeof gig.rating === "number" ? gig.rating : 0,
    reviewCount: typeof gig.review_count === "number" ? gig.review_count : 0,
    category: categoryName,
    deliveryTime: gig.delivery_time,
    badges: gig.badges || [],
    isSaved: true,
  }
}


export default function Home() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isClient, setIsClient] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showSub, setShowSub] = useState(false);
  const router = useRouter()
  const [isBanned, setIsBanned] = useState(false);
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showNewest, setShowNewest] = useState(false);
  const slideInterval = useRef<NodeJS.Timeout | null>(null);
  const [slides, setSlides] = useState<{ 
    image: string; 
    title: string; 
    description: string; 
    cta_link?: string;
    }[]>([])


  // States cho thống kê người dùng
  const [statsLoading, setStatsLoading] = useState(true);
  const [savedGigsCount, setSavedGigsCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [postedGigsCount, setPostedGigsCount] = useState(0);
  const savedGigs = useAllSavedGigs();

  const startSlideAutoPlay = () => {
    if (slideInterval.current) {
      clearInterval(slideInterval.current);
    }
    slideInterval.current = setInterval(() => {
      setCurrentSlide(prev => (slides.length > 0 ? (prev + 1) % slides.length : 0));
    }, 4000);
  };

  // Cập nhật số lượng dịch vụ đã lưu khi savedGigs thay đổi
  useEffect(() => {
    if (savedGigs) {
      setSavedGigsCount(savedGigs.length);
    }
  }, [savedGigs]);

  // Fetch dữ liệu thống kê khi user đăng nhập
  useEffect(() => {
    if (isSignedIn && user?.id) {
      const fetchStats = async () => {
        setStatsLoading(true);
        try {
          const token = await getToken();
          const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          };

          // Fetch orders
          const ordersRes = await fetch(`http://localhost:8800/api/orders`, { headers });
          const ordersData = await ordersRes.json();
          if (ordersData.success) {
            setOrdersCount(ordersData.total || 0);
            // Tính tổng chi tiêu từ các đơn hàng completed
            const completedOrders = (ordersData.orders || []).filter((order: any) => order.order_status === 'completed');
            const total = completedOrders.reduce((sum: number, order: any) => sum + Number(order.total_price || 0), 0);
            setTotalSpent(total);
          }

          // Fetch posted gigs nếu là seller
          if (user.publicMetadata?.isSeller) {
            const gigsRes = await fetch(`http://localhost:8800/api/gigs?seller_clerk_id=${user.id}`, { headers });
            const gigsData = await gigsRes.json();
            if (gigsData.success) {
              setPostedGigsCount(gigsData.total || 0);
            }
          }
        } catch (error) {
          console.error('Error fetching user stats:', error);
        } finally {
          setStatsLoading(false);
        }
      };

      fetchStats();
    }
  }, [isSignedIn, user?.id, getToken]);

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
      .then(async data => {
        console.log('Dữ liệu gigs trả về:', data);
        let gigsData = Array.isArray(data.gigs) ? data.gigs : Array.isArray(data) ? data : [];              
    
        setGigs(gigsData);
      })
      .finally(() => setLoading(false));
  }, []);

  // Auto-advance slides every 4 seconds
  useEffect(() => {
    if (!slides.length) return;
    startSlideAutoPlay();

    return () => {
      if (slideInterval.current) {
        clearInterval(slideInterval.current);
      }
    };
  }, [slides.length]);

  useEffect(() => {
    fetch("http://localhost:8800/api/bannerSlides")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.banners)) {
          const formatted = data.banners.map((slide: any) => ({
            image: slide.image,
            title: slide.title || "",
            description: slide.subtitle || "",
            cta_link: typeof slide?.cta_link === "string" ? slide.cta_link.trim() : "/search"
          }))
          setSlides(formatted)
        }
      })
      .catch(err => {
        console.error("Không thể tải slide:", err)
      })
  }, [])
  
  

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
  const topRateServiceCards = serviceCards.filter(
    (service) => service.badges && service.badges.includes("top_rated")
  );
  const sortedGigs = showNewest 
    ? [...gigs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    : gigs;

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

        {/* Content */}
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

      {/* User Stats Section */}
      {isSignedIn && (
        <section className="bg-gradient-to-b from-white to-gray-50 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-10 text-center bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
              Your Activity Overview
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {statsLoading ? (
                // Loading skeleton
                <>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white p-6 rounded-2xl shadow-lg shadow-emerald-100/20 animate-pulse">
                      <div className="h-12 w-12 rounded-full bg-gray-200 mb-4"></div>
                      <div className="h-8 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="bg-white p-8 rounded-2xl shadow-lg shadow-emerald-100/20 hover:shadow-emerald-100/40 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <Bookmark className="h-6 w-6 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        Saved
                      </span>
                    </div>
                    <h3 className="text-4xl font-bold text-gray-900 mb-2">{savedGigsCount}</h3>
                    <p className="text-gray-500">Saved Services</p>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-lg shadow-emerald-100/20 hover:shadow-emerald-100/40 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <ShoppingBag className="h-6 w-6 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        Orders
                      </span>
                    </div>
                    <h3 className="text-4xl font-bold text-gray-900 mb-2">{ordersCount}</h3>
                    <p className="text-gray-500">Orders Placed</p>
                  </div>

                  <div className="bg-white p-8 rounded-2xl shadow-lg shadow-emerald-100/20 hover:shadow-emerald-100/40 transition-all duration-300 transform hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-emerald-50 rounded-xl">
                        <DollarSign className="h-6 w-6 text-emerald-600" />
                      </div>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                        Spent
                      </span>
                    </div>
                    <h3 className="text-4xl font-bold text-gray-900 mb-2">
                      <PriceDisplay 
                        priceUSD={totalSpent} 
                        className="text-4xl font-bold text-gray-900" 
                      />
                    </h3>
                    <p className="text-gray-500">Total Spent</p>
                  </div>

                  {(user?.publicMetadata as { isSeller?: boolean })?.isSeller && (
                    <div className="bg-white p-8 rounded-2xl shadow-lg shadow-emerald-100/20 hover:shadow-emerald-100/40 transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-emerald-50 rounded-xl">
                          <Store className="h-6 w-6 text-emerald-600" />
                        </div>
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                          Posted
                        </span>
                      </div>
                      <h3 className="text-4xl font-bold text-gray-900 mb-2">{postedGigsCount}</h3>
                      <p className="text-gray-500">Services Posted</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Banner Slider Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="relative max-w-6xl mx-auto group">
            <div className="overflow-hidden rounded-xl">
              <div className="relative flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {slides.map((slide, index) => (
                  <div key={index} className="w-full flex-shrink-0">
                    <div className="relative h-[400px] rounded-xl overflow-hidden">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center ">
                        <div className="text-white p-12">
                          <div className="absolute top-4">
                            <h3 className="text-4xl font-bold mb-4">{slide.title}</h3>
                            <p className="text-xl mb-6">{slide.description}</p>
                          </div>
                          {slide.cta_link && (
                            <div className="absolute bottom-6 right-6">
                              <Button size="lg" asChild variant="secondary">
                                <Link 
                                  href={slide.cta_link}
                                  target={slide.cta_link.startsWith("http") ? "_blank" : "_self"}
                                  rel={slide.cta_link.startsWith("http") ? "noopener noreferrer" : undefined}
                                >
                                  Xem thêm
                                </Link>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Navigation Buttons */}
            <button
              onClick={() => {
                if (slideInterval.current) {
                  clearInterval(slideInterval.current);
                }
                setCurrentSlide(prev => (slides.length > 0 ? (prev - 1 + slides.length) % slides.length : 0));
                setTimeout(() => {
                  startSlideAutoPlay();
                }, 5000);
              }}
              className="absolute left-8 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 duration-300"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={() => {
                if (slideInterval.current) {
                  clearInterval(slideInterval.current);
                }
                setCurrentSlide(prev => (slides.length > 0 ? (prev + 1) % slides.length : 0));
                setTimeout(() => {
                  startSlideAutoPlay();
                }, 5000);
              }}
              className="absolute right-8 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100 duration-300"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
            {/* Slide Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (slideInterval.current) {
                      clearInterval(slideInterval.current);
                    }
                    setCurrentSlide(index);
                  }}
                  className={`h-1.5 rounded-sm transition-all duration-300 ${
                    currentSlide === index 
                      ? "w-8 bg-white" 
                      : "w-4 bg-white/50 hover:bg-white/70"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Popular Categories Section - Chỉ hiển thị khi chưa đăng nhập */}
      {!isSignedIn && (
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
      )}

      {/* Popular Services Section */}
      <section className="bg-gray-50 py-16 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold dark:text-white">Top Picks</h2>
            <Button variant="ghost" asChild>
              <Link href="/search" className="flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {topRateServiceCards.length > 0 ? (
              topRateServiceCards.slice(0, 5).map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  showCategory
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-gray-500">No services available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Explore All Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <h2 className="text-3xl font-bold dark:text-white">Explore All Services</h2>
            <div className="flex gap-2 mt-6">
              <Button
                variant="ghost"
                className={`px-8 py-2 rounded-full font-semibold transition-all duration-200 shadow-sm border
                  ${!showNewest
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-emerald-100'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                onClick={() => setShowNewest(false)}
              >
                All
              </Button>
              <Button
                variant="ghost"
                className={`px-8 py-2 rounded-full font-semibold transition-all duration-200 shadow-sm border
                  ${showNewest
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-emerald-100'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                onClick={() => setShowNewest(true)}
              >
                Newest
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {sortedGigs.map((gig) => (
              <ServiceCard
                key={gig.id}
                service={mapGigToServiceCard(gig)}
                showCategory
              />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {!isSignedIn && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="mb-2 text-center text-3xl font-bold dark:text-white">What Our Customers Say</h2>
            <p className="mb-10 text-center text-gray-600 dark:text-gray-400">
              Thousands of satisfied customers have found the perfect freelance services
            </p>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  id: 1,
                  name: "John Doe",
                  role: "CEO",
                  company: "Tech Corp",
                  avatar: "/testimonials/1.jpg",
                  text: "Found amazing developers for our project. The quality of work exceeded our expectations."
                },
                {
                  id: 2,
                  name: "Sarah Smith",
                  role: "Marketing Director",
                  company: "Creative Agency",
                  avatar: "/testimonials/2.jpg",
                  text: "The designers here are incredibly talented. They helped us rebrand our entire company."
                },
                {
                  id: 3,
                  name: "Mike Johnson",
                  role: "Founder",
                  company: "Startup Inc",
                  avatar: "/testimonials/3.jpg",
                  text: "Great platform for finding reliable freelancers. Will definitely use again!"
                }
              ].map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="mb-4 flex items-center gap-4">
                    <Image
                      src={testimonial.avatar}
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
                  <p className="text-gray-600 dark:text-gray-400">{testimonial.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section - Chỉ hiển thị khi chưa đăng nhập */}
      {!isSignedIn && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-12 text-center text-white">
              <h2 className="mb-4 text-3xl font-bold">Start Today</h2>
              <p className="mb-8 text-lg">
                Join thousands of freelancers and businesses using our platform
              </p>
              <div className="flex justify-center gap-4">
                <SignInButton mode="modal">
                  <Button size="lg" variant="secondary">
                    Become a Seller
                  </Button>
                </SignInButton>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-emerald-600"
                  asChild
                >
                  <Link href="/search">Find Services</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
