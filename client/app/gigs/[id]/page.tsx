"use client";

import { useAuth } from "@clerk/nextjs";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flag,
  Heart,
  Search,
  Share2,
  Star,
  X,
  ZoomIn
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { ChatBubble } from "@/components/message/chatBubble";
import { ContactMeButton } from "@/components/message/contactMeButton";
import { PriceDisplay } from "@/components/price-display";
import { ReportModal } from "@/components/report-modal";
import { ReviewList } from "@/components/review-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserBadge } from "@/components/user-badge";
import { useSavedGigs } from "@/hooks/use-saved-gigs";
import { useMessages } from "@/hooks/useMessages";
import { fetchUser } from "@/lib/api";
import { useUser, SignInButton } from "@clerk/nextjs";
import { ReviewForm } from "@/components/review-form";
import { PortfolioSection } from "@/components/portfolio-section";
import { PortfolioForm } from "@/components/portfolio-form";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { ChatPrompt } from "@/components/message/ChatPrompt";

interface PageParams {
  id: string;
}

export default function GigDetailPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const gigId = Number(resolvedParams.id);
  const { isSaved, isLoading: isSaving, error: saveError, toggleSave } = useSavedGigs(gigId);
  const { user, isSignedIn } = useUser();
  const { userId, isLoaded, getToken } = useAuth();
  const { chatWindows, setChatWindows, sendMessage, markMessagesAsRead, messagesMap } = useMessages({ isDirect: true });
  const [gig, setGig] = useState<any>(null);
  const [loadingGig, setLoadingGig] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [reviewSort, setReviewSort] = useState("relevant");
  const [reviewsToShow, setReviewsToShow] = useState(3);
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingSummary, setRatingSummary] = useState<any>(null);
  const [ratingBreakdown, setRatingBreakdown] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQs, setExpandedFAQs] = useState<number[]>([]);
  const [selectedPackage, setSelectedPackage] = useState("basic");
  const reviewsRef = useRef<HTMLDivElement>(null);
  const [minimizedWindows, setMinimizedWindows] = useState<string[]>([]);
  const socketRef = useRef<any>(null);
  const [userOrder, setUserOrder] = useState<any>(null);
  const [userReview, setUserReview] = useState<any>(null);
  const [visibleReviews, setVisibleReviews] = useState<any[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(true);
  const [showChatBubble, setShowChatBubble] = useState(false);

  const fetchPortfoliosByGigId = async (gigId: number) => {
    if (!gigId) return [];
    const url = `http://localhost:8800/api/portfolios?gig_id=${gigId}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return [];
      const data = await res.json();
      let portfolios: any[] = [];
      if (Array.isArray(data.portfolios)) {
        portfolios = data.portfolios;
      } else if (Array.isArray(data.data)) {
        portfolios = data.data;
      } else if (Array.isArray(data)) {
        portfolios = data;
      }
      return portfolios.map((p: any) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        portfolio_images: Array.isArray(p.portfolio_images) ? p.portfolio_images : [],
        category: p.Category ? { id: p.Category.id, name: p.Category.name } : undefined,
        gig: p.Gig ? { id: p.Gig.id, title: p.Gig.title } : undefined,
      }));
    } catch (err) {
      console.error("Fetch portfolio error:", err);
      return [];
    }
  };

  const fetchReviews = async () => {
    const query = `gig_id=${gigId}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""}${reviewSort ? `&sort=${reviewSort}` : ""}`;
    const res = await fetch(`http://localhost:8800/api/reviews?${query}`);
    const data = await res.json();
    if (data.success) {
      const reviewsWithUser = await Promise.all(
        data.reviews.map(async (review: any) => {
          if (review.user) return review;
          const userRes = await fetch(`http://localhost:8800/api/users/${review.reviewer_clerk_id}`);
          const userData = await userRes.json();
          return {
            ...review,
            user: {
              name: userData.name || userData.username || "User",
              avatar: userData.avatar || "/placeholder.svg",
              country: userData.country || "Unknown",
            },
            date: formatTimeAgo(review.created_at),
          };
        })
      );
      setReviews(reviewsWithUser);
      setVisibleReviews(reviewsWithUser.slice(0, reviewsToShow));
      setRatingSummary(data.ratingSummary);
      setRatingBreakdown(data.ratingBreakdown);
    }
  };

  const handleReviewSuccess = async () => {
    await fetchOrderCompleted();
    await fetchReviews();
    setShowReviewForm(false);
  };
  // Fetch gig data
  useEffect(() => {
    setLoadingGig(true);
    fetch(`http://localhost:8800/api/gigs/${gigId}`)
      .then((res) => res.json())
      .then((data) => setGig(data.gig))
      .catch((err) => console.error("Fetch gig error:", err))
      .finally(() => setLoadingGig(false));
  }, [gigId]);

  // Fetch portfolio
  useEffect(() => {
    if (!gig || !gig.id) return;
    setLoadingPortfolio(true);
    fetchPortfoliosByGigId(gig.id)
      .then((data) => {
        setPortfolios(data);
      })
      .catch(err => {
        console.error("Fetch portfolio error:", err);
        setPortfolios([]);
      })
      .finally(() => setLoadingPortfolio(false));
  }, [gig]);

  // Fetch portfolio by seller clerk id
  // useEffect(() => {
  //   if (!gig?.seller_clerk_id) return;
  //   setLoadingPortfolio(true);
  //   fetchPortfolios(gig.seller_clerk_id, "clerk")
  //     .then(setPortfolios)
  //     .catch(err => console.error("Fetch portfolio error:", err))
  //     .finally(() => setLoadingPortfolio(false));
  // }, [gig?.seller_clerk_id]);

  const refetchReviews = async () => {
    await fetchReviews();
  };
  // Fetch reviews
  useEffect(() => {
    fetchReviews();
  }, [gigId, searchQuery, reviewSort]);

  // Kiểm tra user đã từng mua gig này chưa
  const fetchOrderCompleted = async () => {
    if (!isSignedIn || !user?.id || !gigId) {
      return;
    }
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:8800/api/orders?gig_id=${gigId}&order_status=completed`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success && data.orders && data.orders.length > 0) {
        setUserOrder(data.orders[0]);
        if (data.orders[0].review) {
          setUserReview(data.orders[0].review);
        } else {
          setUserReview(null);
        }
      } else {
        setUserOrder(null);
        setUserReview(null);
      }
    } catch (err) {
    }
  };
  useEffect(() => {
    fetchOrderCompleted();
  }, [isSignedIn, user, gigId, getToken]);

  // Handle contact seller
  const handleContactSeller = async () => {
    if (!isSignedIn || !gig?.seller_clerk_id || !userId) {
      router.push("/sign-in");
      return;
    }
    try {
      const token = await getToken();
      if (!token) {
        return;
      }
      const safeToken = token || "";
      const userData = await fetchUser(String(gig.seller_clerk_id), safeToken);
      
      // Kiểm tra xem chat window đã tồn tại chưa
      const existingWindow = chatWindows.find(w => w.userId === gig.seller_clerk_id);
      if (!existingWindow) {
        setChatWindows((prev) => [
          ...prev,
          {
            userId: gig.seller_clerk_id,
            messages: [],
            unreadCount: 0,
            avatar: userData.avatar || "/placeholder.svg",
            name: userData.name || userData.username || "Seller",
            minimized: true,
          },
        ]);
      }
      // Đảm bảo chat window không bị minimize
      setMinimizedWindows((prev) => prev.filter(id => id !== gig.seller_clerk_id));
      // Join chat room
      if (socketRef.current) {
        socketRef.current.emit("joinChat", { 
          userId: userId, 
          sellerId: gig.seller_clerk_id 
        });
      }
      // MỞ LUÔN CHAT BUBBLE
      setShowChatBubble(true);
    } catch (err) {
    }
  };

  // Send message
  const handleSendMessage = async (content: string, receiverId: string) => {
    if (!userId) return;
    const response = await sendMessage(content, userId, receiverId, null) as { success: boolean; message?: string; error?: string };
    if (response.success) {
      // Tin nhắn đã được gửi thành công và cập nhật trong state
    } else {
    }
  };

  // Toggle minimize/maximize chat window
  const toggleMinimize = (userId: string) => {
    setMinimizedWindows((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Close chat window
  const closeChat = (userId: string) => {
    setChatWindows((prev) =>
      prev.map((w) =>
        w.userId === userId ? { ...w, minimized: true } : w
      )
    );
    setMinimizedWindows((prev) => prev.filter((id) => id !== userId));
  };

  // Mark messages as read when opening a chat
  const handleOpenChat = (userId: string) => {
    markMessagesAsRead(undefined, userId);
    setChatWindows((prev) =>
      prev.map((w) =>
        w.userId === userId ? { ...w, minimized: false } : w
      )
    );
    setMinimizedWindows((prev) => prev.filter((id) => id !== userId));
  };

  // Image navigation
  const nextImage = () => {
    if (!gig?.gig_images?.length) return;
    setSelectedImageIndex((prev) => (prev + 1) % gig.gig_images.length);
  };

  const prevImage = () => {
    if (!gig?.gig_images?.length) return;
    setSelectedImageIndex((prev) => (prev - 1 + gig.gig_images.length) % gig.gig_images.length);
  };

  const openLightbox = (index: number) => {
    if (!gig?.gig_images?.length) return;
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  };

  const nextLightboxImage = () => {
    if (!gig?.gig_images?.length) return;
    setLightboxIndex((prev) => (prev + 1) % gig.gig_images.length);
  };

  const prevLightboxImage = () => {
    if (!gig?.gig_images?.length) return;
    setLightboxIndex((prev) => (prev - 1 + gig.gig_images.length) % gig.gig_images.length);
  };

  // Save/favorite gig
  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave();
    if (!isSaved) {
      toast.success("Added to favorites", {
        description: "Service has been added to your favorites list"
      });
    } else {
      toast.success("Removed from favorites", {
        description: "Service has been removed from your favorites list"
      });
    }
  };

  // Share gig
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: gig.title,
          text: `Check out this gig: ${gig.title}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Error sharing", error));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  // Toggle FAQ
  const toggleFAQ = (index: number) => {
    setExpandedFAQs((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));
  };

  // Hàm format thời gian
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

  // Scroll to reviews
  const scrollToReviews = () => {
    reviewsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Continue to checkout
  const handleContinue = () => {
    if (!isSignedIn) return;
    router.push(`/checkout?gig=${resolvedParams.id}&package=${selectedPackage}`);
  };

  useEffect(() => {
    const fetchDirectMessages = async () => {
      if (!userId || !gig?.seller_clerk_id || userId !== gig.seller_clerk_id) return;
  
      try {
        const token = await getToken();
        const res = await fetch(`http://localhost:8800/api/messages/direct?clerk_id=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
  
        if (data.success && Array.isArray(data.messages)) {
          // Tạo một Map để lưu trữ các buyer duy nhất
          const uniqueBuyers = new Map();
          
          data.messages.forEach((msg: any) => {
            const buyerId = msg.sender_clerk_id !== userId ? msg.sender_clerk_id : msg.receiver_clerk_id;
            if (!uniqueBuyers.has(buyerId)) {
              uniqueBuyers.set(buyerId, {
                userId: String(buyerId),
                messages: data.messages.filter((m: any) => 
                  m.sender_clerk_id === buyerId || m.receiver_clerk_id === buyerId
                ),
                unreadCount: 0,
                avatar: "/placeholder.svg",
                name: "User",
              });
            }
          });

          // Chuyển Map thành mảng và cập nhật chatWindows
          const newChatWindows = Array.from(uniqueBuyers.values());
          setChatWindows(prev => {
            // Lọc ra các chat window hiện tại không có trong newChatWindows
            const existingWindows = prev.filter(w => 
              !newChatWindows.some(nw => nw.userId === w.userId)
            );
            return [...existingWindows, ...newChatWindows];
          });
        }
      } catch (error) {
        console.error("❌ Error fetching direct messages:", error);
      }
    };
  
    fetchDirectMessages();
  }, [userId, gig?.seller_clerk_id, getToken, setChatWindows]);

  useEffect(() => {
    if (
      userId &&
      gig?.seller_clerk_id &&
      userId !== gig.seller_clerk_id &&
      chatWindows.findIndex(w => w.userId === gig.seller_clerk_id) === -1
    ) {
      (async () => {
        const token = getToken ? await getToken() : "";
        const safeToken = token || "";
        const sellerId = String(gig.seller_clerk_id);
        const sellerData = await fetchUser(sellerId, safeToken);
        setChatWindows((prev) => [
          ...prev,
          {
            userId: sellerId,
            messages: [],
            unreadCount: 0,
            avatar: sellerData.avatar || "/placeholder.svg",
            name: sellerData.name || sellerData.username || "Seller",
            minimized: true,
          },
        ]);
      })();
    }
  }, [userId, gig?.seller_clerk_id]);

  if (loadingGig) return <div>Loading...</div>;
  if (!gig) return <div>Gig not found</div>;

  const images = gig.gig_images && Array.isArray(gig.gig_images) && gig.gig_images.length > 0
    ? gig.gig_images
    : (gig.gig_image ? [gig.gig_image] : ["/placeholder.svg"]);
  const seller = gig.seller || {};
  const sellerName =
    (seller.firstname && seller.lastname && `${seller.firstname} ${seller.lastname}`) ||
    seller.firstname ||
    seller.username ||
    "Seller";
  const sellerAvatar = seller.avatar || "/placeholder.svg";
  const faqs = gig.faqs || [
    {
      question: "How many revisions do I get?",
      answer: "The number of revisions depends on the package you choose. Basic includes 2 revisions, Standard includes unlimited revisions, and Premium includes unlimited revisions plus priority support.",
    },
    {
      question: "What file formats will I receive?",
      answer: "You'll receive your logo in multiple formats including PNG, JPG, SVG, and AI.",
    },
  ];
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
        "2 revisions",
      ],
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
        "Social media kit",
      ],
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
        "Priority support",
      ],
    },
  };

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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 overflow-visible">
          {/* Left Column - Gig Details */}
          <div className="lg:col-span-2">
            <h1 className="mb-6 text-2xl font-bold md:text-3xl">{gig.title}</h1>

            {/* Seller Brief */}
            <div className="mb-8 flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="h-12 w-12 overflow-hidden rounded-full border border-gray-200">
                <Image
                  src={sellerAvatar}
                  alt={sellerName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <Link
                  href={`/users/${seller.username || ""}`}
                  className="font-medium hover:text-emerald-600 transition-colors"
                >
                  {sellerName}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-1 font-medium">{ratingSummary?.average || "4.9"}</span>
                    <button
                      onClick={scrollToReviews}
                      className="ml-1 text-gray-600 hover:text-emerald-600 transition-colors"
                    >
                      ({ratingSummary?.total || 156})
                    </button>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-600">{gig.order_count === 1 ? '1 order' : `${gig.order_count || 0} orders`}</span>
                </div>
              </div>
              <ContactMeButton onClick={handleContactSeller} />
            </div>

            {/* Chat Bubbles */}
            {userId !== gig?.seller_clerk_id && chatWindows.length > 0 && (
              <>
                {!showChatBubble && (
                  <ChatPrompt
                    avatar={chatWindows[0].avatar}
                    name={chatWindows[0].name}
                    status={"Online"}
                    onClick={() => setShowChatBubble(true)}
                  />
                )}
                {showChatBubble && (
            <div className="fixed bottom-4 left-4 flex flex-col gap-2 z-[9999]">
                {(() => {
                  const otherId = chatWindows[0].userId;
                  const chatKey = `direct_${otherId}`;
                  return (
                    <ChatBubble
                      key={chatWindows[0].userId}
                      userId={userId || ""}
                      messages={messagesMap[chatKey] || []}
                      avatar={chatWindows[0].avatar}
                      name={chatWindows[0].name}
                      onSendMessage={(content) => handleSendMessage(content, chatWindows[0].userId)}
                      onClose={() => setShowChatBubble(false)}
                      isMinimized={false}
                      onToggleMinimize={() => setShowChatBubble(false)}
                    />
                  );
                })()}
            </div>
                )}
              </>
            )}

            {/* Image Gallery */}
            <div className="mb-8">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 group">
                {images[selectedImageIndex].match(/\.(mp4|mov|avi|wmv)$/i) ? (
                  <video
                    src={images[selectedImageIndex]}
                    controls
                    className="w-full h-full object-cover rounded-lg"
                    onClick={() => openLightbox(selectedImageIndex)}
                  />
                ) : (
                  <Image
                    src={images[selectedImageIndex]}
                    alt={gig.title}
                    fill
                    className="w-full h-auto object-contain rounded-lg cursor-pointer"
                    onClick={() => openLightbox(selectedImageIndex)}
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
                  onClick={() => openLightbox(selectedImageIndex)}
                  className="absolute bottom-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors z-10"
                  title="Xem lớn"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </div>
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
                        <Image
                          src={media}
                          alt={`${gig.title} - Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
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

            {/* Portfolio Section */}
            <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">My Portfolio</h2>
              <PortfolioGrid
                portfolios={portfolios}
                clerkId={gig?.seller_clerk_id}  
                isSeller={true}
                username={seller.username || ""}
              />
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
                    <li key={idx} className="text-gray-700">{req.requirement_text}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reviews */}
            <div ref={reviewsRef} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Reviews</h2>
              {ratingSummary && (
                <div className="mt-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <span className="text-2xl font-bold">{ratingSummary.average}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({ratingSummary.total} reviews for this Gig)
                      </span>
                    </div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-5 w-5 ${
                            star <= Math.round(ratingSummary.average)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <div className="space-y-2">
                        {[5, 4, 3, 2, 1].map((star) => (
                          <div key={star} className="flex items-center gap-2">
                            <span className="w-12 text-sm">{star} Star{star !== 1 && "s"}</span>
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-800"
                                style={{
                                  width: `${(ratingSummary.breakdown[star] / ratingSummary.total) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="w-12 text-sm text-gray-500">
                              ({ratingSummary.breakdown[star]})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {ratingBreakdown && (
                      <div>
                        <h4 className="text-sm font-semibold">Rating Breakdown</h4>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Seller communication level</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{ratingBreakdown.sellerCommunication}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Quality of delivery</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{ratingBreakdown.qualityOfDelivery}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Value of delivery</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm">{ratingBreakdown.valueOfDelivery}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Input
                    placeholder="Search reviews"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                </div>
                <Select value={reviewSort} onValueChange={setReviewSort}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevant">Most Relevant</SelectItem>
                    <SelectItem value="recent">Most Recent</SelectItem>
                    <SelectItem value="highest">Highest Rated</SelectItem>
                    <SelectItem value="lowest">Lowest Rated</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-6">
              <ReviewList 
                reviews={visibleReviews} 
                onReviewDelete={fetchOrderCompleted}
                onReviewUpdate={(updatedReview) => {
                  if (!updatedReview) return;
                  setReviews(prev =>
                    prev.map(r => r.id === updatedReview.id ? {
                      ...updatedReview,
                      date: formatTimeAgo(updatedReview.created_at || new Date().toISOString()),
                    } : r)
                  );
                  fetchReviews(); // để cập nhật cả breakdown
                }}
              />
              </div>

              {visibleReviews.length < reviews.length && (
                <Button
                  variant="outline"
                  className="mt-6 w-full hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                  onClick={() => {
                    const newCount = reviewsToShow + 3;
                    setReviewsToShow(newCount);
                    setVisibleReviews(reviews.slice(0, newCount));
                  }}
                >
                  Show More Reviews
                </Button>
              )}
            </div>

            {/* Render ReviewForm */}
            {isSignedIn && userOrder && !userReview && user?.id !== gig?.seller_clerk_id && (
              <div className="my-8">
                <ReviewForm orderId={userOrder.id} gigId={Number(gigId)} buyerInfo={{
                  name: user?.fullName || user?.username || 'User',
                  country: typeof user?.publicMetadata?.country === 'string' ? user.publicMetadata.country : '',
                  price: userOrder.total_price,
                  duration: userOrder.duration,
                }} 
                onReviewSuccess={() => {
                  handleReviewSuccess();
                }} 
                />
              </div>
            )}
          </div>

          {/* Right Column - Packages */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 mb-2">
                  <span className="text-2xl font-bold text-gray-900">
                    <PriceDisplay priceUSD={packages.basic.price} />
                  </span>
                  <span className="text-sm text-gray-500">{packages.basic.deliveryTime} days delivery</span>
                </div>
                <ul className="space-y-3 w-full">
                  {packages.basic.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 flex-shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {isSignedIn ? (
                  <Button
                    onClick={handleContinue}
                    className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors mt-4"
                  >
                    Continue
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <button className="w-full rounded-full bg-emerald-500 hover:bg-emerald-600 transition-colors py-2 font-semibold text-white text-lg mt-4">Continue</button>
                  </SignInButton>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                {isSignedIn ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                    disabled={isSaving}
                  >
                    <Heart className={`mr-2 h-4 w-4 ${isSaved ? "fill-red-500 text-red-500" : ""}`} />
                    {isSaved ? "Saved" : "Save"}
                  </Button>
                ) : (
                  <SignInButton mode="modal">
                    <button className="border border-gray-200 rounded-md px-3 py-2 flex items-center gap-2 text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" type="button">
                      <Heart className="mr-2 h-4 w-4" />Save
                    </button>
                  </SignInButton>
                )}
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
                      ownerId={gig.seller_clerk_id}
                      currentUserId={user?.id}
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
                style={{ background: "#222" }}
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
  );
}