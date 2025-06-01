"use client"

import type React from "react"
import { SignInButton, SignUpButton, UserButton, useUser, useAuth } from "@clerk/nextjs"
import { BarChart, Bell, Briefcase, Camera, ChevronLeft, ChevronRight, Code, Database, Heart, LayoutDashboard, MessageSquare, Music, Palette, PenTool, Search, ShoppingCart, Smile, Video, User, FolderKanban, X, Globe, ImageIcon, TrendingUp, Share2, Sparkles, FileText, Monitor, Mic, Gamepad2, Home, Calendar, Star } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"

import { LanguageCurrencySwitcher } from "@/components/language-currency-switcher"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useNotificationSocket } from "@/hooks/useNotificationSocket";
import { toast } from "sonner";

export function Navbar() {
  const { isSignedIn, isLoaded, user } = useUser()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([])
  const categoriesRef = useRef<HTMLDivElement>(null)
  const [showLeftButton, setShowLeftButton] = useState(false)
  const [showRightButton, setShowRightButton] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [openNotify, setOpenNotify] = useState(false);
  const [openMsg, setOpenMsg] = useState(false);
  const messages: { title: string; time: string }[] = [] // Thay bằng dữ liệu thực tế nếu có
  const isAdmin = user?.publicMetadata?.isAdmin
  const isSeller = user?.publicMetadata?.isSeller
  const isBuyer = user?.publicMetadata?.isBuyer
  const { userId, getToken } = useAuth();
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const clickedInsideDropdownRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useNotificationSocket(userId ?? "", (notification) => {
    toast(`🔔 ${notification.title}: ${notification.message}`);
    setNotifications((prev) => [notification, ...prev]);
  });
  
  // Mapping tên category sang icon
  const categoryIcons: Record<string, React.ReactNode> = {
    "Web Development": <Globe className="h-4 w-4" />,
    "Graphic Illustration": <ImageIcon className="h-4 w-4" />,
    "SEO Services": <TrendingUp className="h-4 w-4" />,
    "Social Media Management": <Share2 className="h-4 w-4" />,
    "Animation Design": <Sparkles className="h-4 w-4" />,
    "Content Creation": <FileText className="h-4 w-4" />,
    "E-commerce Solutions": <ShoppingCart className="h-4 w-4" />,
    "UI/UX Design": <Smile className="h-4 w-4" />,
    "Voice Acting": <Mic className="h-4 w-4" />,
    "Mobile App Development": <Monitor className="h-4 w-4" />,
    "Video Editing": <Video className="h-4 w-4" />,
    "Copywriting": <PenTool className="h-4 w-4" />,
    "Game Development": <Gamepad2 className="h-4 w-4" />,
    "Interior Design": <Home className="h-4 w-4" />,
    "Event Planning": <Calendar className="h-4 w-4" />,
  };


// Ẩn dropdown khi click ra ngoài
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node) &&
      inputRef.current &&
      !inputRef.current.contains(event.target as Node)
    ) {
      setShowHistoryDropdown(false);
    }
  };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle click outside for notification dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifyRef.current && !notifyRef.current.contains(event.target as Node)) {
        setOpenNotify(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const goToSearch = (keyword: string) => {
    const query = keyword.trim();
    if (!query) return;
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set("q", query);
  
    let currency = "USD";
    if (typeof window !== "undefined") {
      currency = localStorage.getItem("currency") || "USD";
    }
  
    if (!currentParams.get("minPrice")) currentParams.set("minPrice", currency === "VND" ? "0" : "10");
    if (!currentParams.get("maxPrice")) currentParams.set("maxPrice", currency === "VND" ? "30000000" : "500");
  
    router.push(`/search?${currentParams.toString()}`);
    setSearchQuery(query);
    setShowHistoryDropdown(false);
  };
  

  // Fetch search history
  const fetchSearchHistory = async () => {
    if (!userId) return;
    setLoadingHistory(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:8800/api/userSearchHistory?clerk_id=${userId}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.history)) {
        setSearchHistory(data.history);
      } else {
        setSearchHistory([]);
      }
    } catch {
      setSearchHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Save search history
  const handleSaveSearchHistory = async (keyword: string) => {
    if (!userId || !keyword) return;
    try {
      const token = await getToken();
      await fetch(`http://localhost:8800/api/userSearchHistory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clerk_id: userId,
          search_keyword: keyword,
          search_date: new Date().toISOString(),
        }),
      });
    } catch {}
  };

  // Xóa 1 lịch sử
  const handleDeleteHistory = async (id: number) => {
    if (!userId) return;
    setIsDeletingHistory(true);
    try {
      const token = await getToken();
      await fetch(`http://localhost:8800/api/userSearchHistory/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchHistory((prev) => prev.filter((item) => item.id !== id));
    } catch {}
    setTimeout(() => setIsDeletingHistory(false), 100); // Đảm bảo flag reset sau thao tác
  };

  // Xóa tất cả lịch sử
  const handleDeleteAllHistory = async () => {
    if (!userId) return;
    setIsDeletingHistory(true);
    try {
      const token = await getToken();
      await fetch(`http://localhost:8800/api/userSearchHistory/all?clerk_id=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchHistory([]);
    } catch {}
    setTimeout(() => setIsDeletingHistory(false), 100);
  };

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!userId) return;
    setLoadingNotifications(true);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:8800/api/notifications?clerk_id=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setNotifications(data.notifications);
    } catch (err) {
      console.error("Lỗi fetch thông báo:", err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark all notifications as read and refetch
  const handleMarkAllAsRead = async () => {
    if (!userId) return;
    const token = await getToken();
    const res = await fetch("http://localhost:8800/api/notifications/mark-all-as-read", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ clerk_id: userId }),
    });
    if (res.ok) {
      await fetchNotifications();
    }
  };

  // Khi submit search, lưu lịch sử nếu đã đăng nhập
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (userId) await handleSaveSearchHistory(searchQuery.trim());
    goToSearch(searchQuery);
  };

  // Khi focus vào ô search, fetch lịch sử
  const handleInputFocus = () => {
    if (userId) {
      fetchSearchHistory();
      setShowHistoryDropdown(true);
    }
  };
  // Khi blur, ẩn dropdown sau 200ms (để kịp click), nhưng không ẩn nếu đang xóa
  const handleInputBlur = () => {
    setTimeout(() => {
      if (!clickedInsideDropdownRef.current && !isDeletingHistory) {
        setShowHistoryDropdown(false);
      }
      clickedInsideDropdownRef.current = false;
    }, 200);
  };

  const checkScrollButtons = () => {
    if (!categoriesRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current
    setShowLeftButton(scrollLeft > 0)
    setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1)
  }

  useEffect(() => {
    const container = categoriesRef.current
    if (!container) return

    // Kiểm tra ban đầu
    checkScrollButtons()

    // Theo dõi sự kiện scroll
    container.addEventListener('scroll', checkScrollButtons)

    // Theo dõi thay đổi kích thước
    const resizeObserver = new ResizeObserver(checkScrollButtons)
    resizeObserver.observe(container)

    return () => {
      container.removeEventListener('scroll', checkScrollButtons)
      resizeObserver.disconnect()
    }
  }, [])

  const scrollLeft = () => {
    if (!categoriesRef.current) return
    categoriesRef.current.scrollBy({ left: -200, behavior: 'smooth' })
  }

  const scrollRight = () => {
    if (!categoriesRef.current) return
    categoriesRef.current.scrollBy({ left: 200, behavior: 'smooth' })
  }

  const handleSignIn = () => {
    setIsAuthModalOpen(true)
  }

  const handleSignUp = () => {
    setIsAuthModalOpen(true)
  }


  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8800/api/categories')
        const data = await response.json()
        if (data.success && data.categories) {
          setCategories(data.categories)
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Tự động push đến /admin nếu vừa đăng nhập và là admin, không ở /admin
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      if (isAdmin && pathname !== "/admin/admin-dashboard" && pathname !== "/select-role") {
        router.push("/admin/admin-dashboard");
      } else if ((isSeller || isBuyer || (isSeller && isBuyer)) && pathname === "/dashboard" || pathname === "/dashboard/user" || pathname === "/dashboard/buyer" || pathname === "/dashboard/seller" || pathname === "/sign-in") {
        router.push("/");
      }
    }
  }, [isLoaded, isSignedIn, isAdmin, isSeller, isBuyer, pathname, router]);

  // Don't show navbar on role selection page
  if (pathname === "/select-role") {
    return null
  }

  useEffect(() => {
    if (openNotify) {
      fetchNotifications();
    }
  }, [openNotify]);

  useEffect(() => {
    setOpenNotify(false);
  }, [pathname]);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center" suppressHydrationWarning>
          <div className="mr-4 flex" suppressHydrationWarning>
            <Link href="/" prefetch className="mr-6 flex items-center space-x-2">
              <Image src="/logo.png" alt="Logo" width={32} height={32} />
              <span className="hidden font-bold sm:inline-block">JobNOVA</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center gap-4" suppressHydrationWarning>
            <form onSubmit={handleSearch} className="relative flex-1 mx-4 flex">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                type="search"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="w-full h-10 pl-10 pr-12 text-base rounded-md bg-background placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-emerald-500 border"
              />
              {/* Dropdown lịch sử tìm kiếm */}
              {showHistoryDropdown && (
                <div 
                  ref={dropdownRef}
                  onMouseDown={() => (clickedInsideDropdownRef.current = true)}
                  className="absolute left-0 top-full mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-72 overflow-y-auto"
                  >
                  <div className="px-4 py-2 text-xs italic text-gray-500 border-b bg-gray-50 rounded-t-xl">Lịch sử tìm kiếm</div>
                  {loadingHistory ? (
                    <div className="p-4 text-center text-gray-500 text-sm">Đang tải...</div>
                  ) : searchHistory.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">Không có lịch sử tìm kiếm</div>
                  ) : (
                    <>
                      <ul>
                        {searchHistory.map((item) => (
                          <li
                            key={item.id}
                            className="group flex items-center justify-between px-4 py-2 hover:bg-emerald-50 transition-colors cursor-pointer text-gray-700"
                            onClick={() => goToSearch(item.search_keyword)}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="truncate">{item.search_keyword}</span>
                            </div>
                            <button
                              className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteHistory(item.id);
                              }}
                              tabIndex={-1}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <button
                        className="w-full text-center text-xs text-red-500 hover:bg-red-50 py-2 border-t border-gray-100 font-semibold"
                        onClick={handleDeleteAllHistory}
                      >
                        Xóa tất cả lịch sử
                      </button>
                    </>
                  )}
                </div>
              )}
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-md"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex items-center gap-2 shrink-0" suppressHydrationWarning>
              {!isLoaded ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" suppressHydrationWarning />
              ) : isSignedIn ? (
                <>
                  <LanguageCurrencySwitcher />
                  {/* Profile Icon */}
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={user?.username ? `/users/${user.username}` : "/profile"}>
                          <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 outline-none">
                            <User className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Profile</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {/* My Job Icon - chỉ hiện khi là seller */}
                  {isSeller ? (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href="/my-gigs">
                            <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 outline-none">
                              <FolderKanban className="h-5 w-5" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>My Job</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}

                  {/* Notify Dropdown on click with tooltip on hover */}
                  <div className="relative flex items-center" ref={notifyRef}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => setOpenNotify(!openNotify)}
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 !outline-none !ring-0"
                            style={{ outline: "none", boxShadow: "none", position: "relative" }}
                          >
                            <Bell className="h-5 w-5" />
                            {notifications.filter(n => !n.is_read).length > 0 && (
                              <span className="absolute -top-1 -right-1 min-w-[18px] h-5 flex items-center justify-center rounded-full bg-emerald-500 text-white text-xs px-1">
                                {notifications.filter(n => !n.is_read).length > 9 ? '9+' : notifications.filter(n => !n.is_read).length}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Notifications</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {openNotify && (
                      <div
                        className="absolute top-full right-0 z-50 w-80 bg-white shadow-lg rounded-b-lg"
                        onWheel={e => e.stopPropagation()}
                      >
                        <div className="font-semibold px-4 py-2 border-b">Notifications</div>
                        <div
                          className="h-96 overflow-y-auto divide-y divide-gray-100"
                          onWheel={e => e.stopPropagation()}
                          onScroll={e => e.stopPropagation()}
                        >
                          {loadingNotifications ? (
                            <div className="flex flex-col gap-3 p-4">
                              {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex gap-3 items-center animate-pulse">
                                  <div className="w-8 h-8 rounded-full bg-gray-200" />
                                  <div className="flex-1 space-y-2">
                                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                                    <div className="h-2 w-1/3 bg-gray-100 rounded" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <Bell className="mb-2 h-10 w-10 text-gray-300" />
                              <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                          ) : (
                            notifications.map((item, idx) => {
                              const isUnread = !item.is_read;
                              let icon = <Bell className="h-5 w-5 text-gray-400" />;
                              if (item.notification_type === "review") icon = <Star className="h-5 w-5 text-yellow-500" />;
                              if (item.notification_type === "message") icon = <MessageSquare className="h-5 w-5 text-blue-500" />;
                              const timeAgo = item.time ? formatDistanceToNow(new Date(item.time), { addSuffix: true }) : "";
                              return (
                                <div
                                  key={idx}
                                  className={`relative flex gap-3 items-start whitespace-normal py-3 px-4 cursor-pointer transition-colors ${isUnread ? 'bg-emerald-50 font-semibold' : 'bg-white'} hover:bg-emerald-100 border-l-4 ${isUnread ? 'border-emerald-500' : 'border-transparent'}`}
                                  onClick={() => {
                                    if (item.gig_id && item.notification_type === "review") {
                                      router.push(`/gigs/${item.gig_id}`);
                                    }
                                  }}
                                >
                                  {/* Dấu chấm xanh cho chưa đọc */}
                                  {isUnread && <span className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 w-2 h-2 rounded-full bg-emerald-500" />}
                                  <div className="flex-shrink-0 mt-1">{icon}</div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{item.title}</div>
                                    <div className="text-xs text-gray-400 mb-1">{timeAgo}</div>
                                    <div className="text-sm text-gray-700 truncate">{item.message}</div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="border-t px-4 py-2 bg-white sticky bottom-0">
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-emerald-600 hover:underline w-full text-center text-sm font-medium"
                          >
                            Mark all as read
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message button with tooltip */}
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/messages">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 !outline-none !ring-0"
                            style={{ outline: "none", boxShadow: "none" }}
                          >
                            <MessageSquare className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Messages</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Saved Tooltip */}
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/saved">
                          <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 outline-none">
                            <Heart className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Favorites Jobs</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Cart Tooltip */}
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href="/orders">
                          <Button variant="ghost" size="icon" className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 outline-none">
                            <ShoppingCart className="h-5 w-5" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Cart</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <UserButton />
                </>
              ) : (
                <div className="flex items-center gap-2" suppressHydrationWarning>
                  <SignInButton mode="modal">
                    <Button variant="ghost">Đăng nhập</Button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <Button>Đăng ký</Button>
                  </SignUpButton>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subnavbar - Categories */}
        <div className="border-t bg-white">
          <div className="container relative">
            {showLeftButton && (
              <button 
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-r-lg shadow-md z-10 hidden md:flex items-center justify-center transition-opacity duration-200"
                onClick={scrollLeft}
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <div className="overflow-hidden">
              <nav 
                ref={categoriesRef}
                className="flex items-center space-x-4 overflow-x-auto py-2 whitespace-nowrap touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
              >
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/search?category=${category.id}`}
                    className="flex items-center space-x-1 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors whitespace-nowrap"
                  >
                    {categoryIcons[category.name] || <Palette className="h-4 w-4" />}
                    <span>{category.name}</span>
                  </Link>
                ))}
              </nav>
            </div>
            {showRightButton && (
              <button 
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-l-lg shadow-md z-10 hidden md:flex items-center justify-center transition-opacity duration-200"
                onClick={scrollRight}
                aria-label="Scroll right"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </header>


    </>
  )
}
