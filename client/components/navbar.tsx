"use client"

import type React from "react"
import { SignInButton, SignUpButton, UserButton, useUser, useAuth } from "@clerk/nextjs"
import { BarChart, Bell, Briefcase, Camera, ChevronLeft, ChevronRight, Code, Database, Heart, LayoutDashboard, MessageSquare, Music, Palette, PenTool, Search, ShoppingCart, Smile, Video, User, FolderKanban, X, Globe, ImageIcon, TrendingUp, Share2, Sparkles, FileText, Monitor, Mic, Gamepad2, Home, Calendar, Star, Phone, Mail } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

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
import { useNotification } from "@/context/notification-context";
import { useMessages } from "@/hooks/useMessages";
import { fetchUser } from "@/lib/api";

interface NavbarProps {
  isVisible?: boolean;
}

// Custom hooks
function useSearchHistory(userId: string | null, getToken: () => Promise<string | null>) {
  const [searchHistory, setSearchHistory] = useState<any[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isDeletingHistory, setIsDeletingHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const clickedInsideDropdownRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    setTimeout(() => setIsDeletingHistory(false), 100);
  };

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

  const handleSearch = async (e: React.FormEvent, searchQuery: string, goToSearch: (query: string) => void) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (userId) await handleSaveSearchHistory(searchQuery.trim());
    goToSearch(searchQuery);
  };

  const handleInputFocus = () => {
    if (userId) {
      fetchSearchHistory();
      setShowHistoryDropdown(true);
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => {
      if (!clickedInsideDropdownRef.current && !isDeletingHistory) {
        setShowHistoryDropdown(false);
      }
      clickedInsideDropdownRef.current = false;
    }, 200);
  };

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

  return {
    searchHistory,
    showHistoryDropdown,
    setShowHistoryDropdown,
    loadingHistory,
    isDeletingHistory,
    inputRef,
    dropdownRef,
    clickedInsideDropdownRef,
    fetchSearchHistory,
    handleSaveSearchHistory,
    handleDeleteHistory,
    handleDeleteAllHistory,
    handleSearch,
    handleInputFocus,
    handleInputBlur,
  };
}

function useNotificationDropdown() {
  const [openNotify, setOpenNotify] = useState(false);
  const notifyRef = useRef<HTMLDivElement>(null);

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

  return { openNotify, setOpenNotify, notifyRef };
}

function useMessageDropdown() {
  const [openMsg, setOpenMsg] = useState(false);
  const msgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (msgRef.current && !msgRef.current.contains(event.target as Node)) {
        setOpenMsg(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return { openMsg, setOpenMsg, msgRef };
}

function useCategories() {
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [showLeftButton, setShowLeftButton] = useState(false);
  const [showRightButton, setShowRightButton] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8800/api/categories');
        const data = await response.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const container = categoriesRef.current;
    if (!container) return;

    const checkScrollButtons = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftButton(scrollLeft > 0);
      setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1);
    };

    checkScrollButtons();
    container.addEventListener('scroll', checkScrollButtons);
    const resizeObserver = new ResizeObserver(checkScrollButtons);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', checkScrollButtons);
      resizeObserver.disconnect();
    };
  }, []);

  const scrollLeft = () => {
    if (!categoriesRef.current) return;
    categoriesRef.current.scrollBy({ left: -200, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (!categoriesRef.current) return;
    categoriesRef.current.scrollBy({ left: 200, behavior: 'smooth' });
  };

  return {
    categories,
    showLeftButton,
    showRightButton,
    categoriesRef,
    scrollLeft,
    scrollRight,
  };
}

// @ts-ignore - We know isAdmin is boolean because we check metadata.isAdmin === true
function useAdminRedirect(
  isLoaded: boolean,
  isSignedIn: boolean,
  isAdmin: boolean,
  pathname: string,
  router: any
) {
  useEffect(() => {
    if (isLoaded && isSignedIn && isAdmin) {
      if (pathname !== "/admin/admin-dashboard" && pathname !== "/select-role") {
        router.push("/admin/admin-dashboard");
      }
    }
  }, [isLoaded, isSignedIn, isAdmin, pathname, router]);
}

function useNotificationFetch(openNotify: boolean, fetchNotifications: () => void) {
  useEffect(() => {
    if (openNotify) {
      fetchNotifications();
    }
  }, [openNotify, fetchNotifications]);
}

function useNotificationClose(pathname: string, setOpenNotify: (open: boolean) => void) {
  useEffect(() => {
    setOpenNotify(false);
  }, [pathname, setOpenNotify]);
}

function useUserInfoMap(tickets: any[], userId: string | null, setUserInfoMap: (map: Record<string, { name: string; avatar: string }>) => void) {
  const [localUserInfoMap, setLocalUserInfoMap] = useState<Record<string, { name: string; avatar: string }>>({});

  useEffect(() => {
    const fetchAll = async () => {
      const uniqueUserIds = Array.from(new Set(tickets.map(t => {
        if (!t.order_id) return t.buyer_clerk_id === userId ? t.seller_clerk_id : t.buyer_clerk_id;
        return t.buyer_clerk_id === userId ? t.seller_clerk_id : t.buyer_clerk_id;
      })));
      for (const clerkId of uniqueUserIds) {
        if (clerkId && !localUserInfoMap[clerkId]) {
          try {
            const userData = await fetchUser(clerkId, "");
            setLocalUserInfoMap(prev => ({
              ...prev,
              [clerkId]: {
                name: (userData.lastname && userData.firstname)
                  ? `${userData.lastname} ${userData.firstname}`
                  : (userData.firstname || userData.lastname || userData.username || "User"),
                avatar: userData.avatar || "/placeholder.svg",
              },
            }));
          } catch {}
        }
      }
    };
    fetchAll();
  }, [tickets, userId, localUserInfoMap]);

  useEffect(() => {
    setUserInfoMap(localUserInfoMap);
  }, [localUserInfoMap, setUserInfoMap]);
}

export function Navbar({ isVisible = true }: NavbarProps) {
  // Context hooks
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn, isLoaded, user } = useUser()
  const { userId, getToken } = useAuth();
  const { unreadCount, tickets, loading: loadingMessages, fetchTicketsData } = useMessages({});
  const { notifications, markAllAsRead, markAsRead, fetchNotifications, loading: loadingNotifications, addNotification } = useNotification();

  // Custom hooks
  useNotificationSocket(userId ?? "", (notification) => {
    toast(`🔔 ${notification.title}: ${notification.message}`);
    addNotification(notification);
  });

  const {
    searchHistory,
    showHistoryDropdown,
    setShowHistoryDropdown,
    loadingHistory,
    isDeletingHistory,
    inputRef,
    dropdownRef,
    clickedInsideDropdownRef,
    fetchSearchHistory,
    handleSaveSearchHistory,
    handleDeleteHistory,
    handleDeleteAllHistory,
    handleSearch,
    handleInputFocus,
    handleInputBlur,
  } = useSearchHistory(userId || null, getToken);

  const { openNotify, setOpenNotify, notifyRef } = useNotificationDropdown();
  const { openMsg, setOpenMsg, msgRef } = useMessageDropdown();
  const { categories, showLeftButton, showRightButton, categoriesRef, scrollLeft, scrollRight } = useCategories();

  // State hooks
  const [searchQuery, setSearchQuery] = useState("")
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [openSystemModal, setOpenSystemModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [openHelpModal, setOpenHelpModal] = useState(false)
  const [userInfoMap, setUserInfoMap] = useState<Record<string, { name: string; avatar: string }>>({})

  // Additional custom hooks
  const metadata = user?.publicMetadata || {};
  const isAdmin = metadata.isAdmin === true;
  const isSeller = metadata.isSeller === true;
  const isBuyer = metadata.isBuyer === true;

  // @ts-ignore - We know isAdmin is boolean because we check metadata.isAdmin === true
  useAdminRedirect(isLoaded, isSignedIn, isAdmin, pathname, router);
  useNotificationFetch(openNotify, fetchNotifications);
  useNotificationClose(pathname, setOpenNotify);
  useUserInfoMap(tickets, userId || null, setUserInfoMap);

  // Early return - sau khi đã khai báo tất cả hooks
  if (!isVisible || pathname === "/select-role") return null;

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

  const handleSignIn = () => {
    setIsAuthModalOpen(true)
  }

  const handleSignUp = () => {
    setIsAuthModalOpen(true)
  }

  const getUserInfo = (clerkId: string) => {
    return userInfoMap[clerkId] || { name: "User", avatar: "/placeholder.svg" };
  };

  const filteredTickets = tickets.filter(ticket => ticket.last_message && ticket.last_message.message_content);

  // Loại bỏ ticket trùng key cho dropdown message (chỉ dựa vào direct_${otherUserId} hoặc order_${ticket.order_id})
  const seenMsgKeys = new Set();
  const uniqueDropdownTickets = filteredTickets.filter(ticket => {
    const isDirect = ticket.is_direct || !ticket.order_id;
    const otherUserId = isDirect
      ? (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id)
      : (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id);
    const key = isDirect
      ? `direct_${otherUserId}`
      : `order_${ticket.order_id}`;
    if (seenMsgKeys.has(key)) return false;
    seenMsgKeys.add(key);
    return true;
  });

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
            <form onSubmit={(e) => handleSearch(e, searchQuery, goToSearch)} className="relative flex-1 mx-4 flex">
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
                              <span
                                className={
                                  `absolute -top-2 -right-2 min-w-[22px] h-[22px] flex items-center justify-center rounded-full
                                  bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-lg border-2 border-white
                                  text-white text-base font-bold px-1 select-none
                                  transition-all duration-200`
                                }
                                style={{ zIndex: 2 }}
                              >
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
                        className="absolute top-full right-0 z-50 w-80 bg-white shadow-lg rounded-[4px]"
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
                              const isSystem = item.notification_type === "system";
                              return (
                                <div
                                  key={idx}
                                  className={`relative flex gap-3 items-start whitespace-normal py-3 px-4 cursor-pointer transition-colors ${isUnread ? 'bg-emerald-50 font-semibold' : 'bg-white'} hover:bg-emerald-100 border-l-4 ${isUnread ? 'border-emerald-500' : 'border-transparent'}`}
                                  onClick={() => {
                                    if (isUnread) markAsRead(item.id);
                                    if (isSystem) {
                                      setSelectedNotification(item);
                                      setOpenSystemModal(true);
                                    } else if (item.gig_id && item.notification_type === "review") {
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
                        <div className="border-t px-4 py-2 bg-white sticky bottom-0 rounded-b-[4px]">
                          <button
                            onClick={markAllAsRead}
                            className="text-emerald-600 hover:underline w-full text-center text-sm font-medium"
                          >
                            Mark all as read
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Dropdown giống notification */}
                  <div className="relative flex items-center" ref={msgRef}>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={() => {
                              setOpenMsg(!openMsg);
                              if (!openMsg) fetchTicketsData();
                            }}
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 !outline-none !ring-0"
                            style={{ outline: "none", boxShadow: "none", position: "relative" }}
                          >
                            <MessageSquare className="h-5 w-5" />
                            {unreadCount > 0 && (
                              <span
                                className="absolute -top-2 -right-2 min-w-[22px] h-[22px] flex items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 to-emerald-600 shadow-lg border-2 border-white text-white text-base font-bold px-1 select-none transition-all duration-200"
                                style={{ zIndex: 2 }}
                              >
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </span>
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Messages</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {openMsg && (
                      <div className="absolute top-full right-0 z-50 w-80 bg-white shadow-lg rounded-[4px] flex flex-col h-[467px]">
                        <div className="font-semibold px-4 py-2 border-b">Messages</div>
                        <div className="h-96 flex-1 overflow-y-auto divide-y divide-gray-100">
                          {loadingMessages ? (
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
                          ) : uniqueDropdownTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <MessageSquare className="mb-2 h-10 w-10 text-gray-300" />
                              <p className="text-sm text-gray-500">No messages yet</p>
                            </div>
                          ) : (
                            uniqueDropdownTickets.slice(0, 5).map((ticket) => {
                              const lastMsg = ticket.last_message;
                              const isDirect = ticket.is_direct || !ticket.order_id;
                              const otherUserId = isDirect
                                ? (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id)
                                : (ticket.buyer_clerk_id === userId ? ticket.seller_clerk_id : ticket.buyer_clerk_id);
                              const userInfo = getUserInfo(otherUserId);
                              const name = isDirect ? userInfo.name : `Order #${ticket.order_id}`;
                              const avatar = userInfo.avatar;
                              const timeAgo = lastMsg?.sent_at ? formatDistanceToNow(new Date(lastMsg.sent_at), { addSuffix: true }) : "";
                              const isUnread = !!(lastMsg && (lastMsg as any).is_read === false && (lastMsg as any).receiver_clerk_id === userId);
                              return (
                                <div key={isDirect ? `direct_${otherUserId}` : `order_${ticket.order_id}`}
                                  className={`relative flex gap-3 items-start whitespace-normal py-3 px-4 cursor-pointer transition-colors hover:bg-emerald-100 border-l-4 border-transparent ${isUnread ? 'bg-emerald-50 font-semibold' : 'bg-white'}`}
                                  onClick={() => router.push(`/messages?type=${isDirect ? "direct" : "order"}&id=${isDirect ? otherUserId : ticket.order_id}`)}
                                >
                                  <div className="flex-shrink-0 mt-1">
                                    <img src={avatar} alt={name} className="h-8 w-8 rounded-full border border-emerald-100 object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{name}</div>
                                    <div className="text-xs text-gray-400 mb-1">{timeAgo}</div>
                                    <div className="text-sm text-gray-700 truncate">{lastMsg?.message_content || "No message"}</div>
                                  </div>
                                  {(ticket.unread_count ?? 0) > 0 && (
                                    <span className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold">{ticket.unread_count}</span>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                        <div className="border-t px-4 py-2 bg-white sticky bottom-0 rounded-b-[4px]">
                          <Link href="/messages" className="block text-emerald-600 hover:underline w-full text-center text-sm font-medium pt-2">View all messages</Link>
                        </div>
                      </div>
                    )}
                  </div>

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
        { !pathname.startsWith("/messages") && (
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
        )}
      </header>

      {/* Modal chi tiết notification system */}
      <Dialog open={openSystemModal} onOpenChange={setOpenSystemModal}>
        <DialogContent className="max-w-md">
          <DialogTitle className="text-2xl font-bold mb-2">{selectedNotification?.title || "System Notification"}</DialogTitle>
          <div className="text-base text-gray-700 mb-4">
            {/* Thông điệp chính, tách reason nếu có */}
            {selectedNotification?.message?.split("Reason:")[0]?.trim()}
          </div>
          {selectedNotification?.message?.includes("Reason:") && (
            <div className="flex items-center gap-2 bg-orange-50 border-l-4 border-orange-400 rounded-md px-3 py-2 mb-4 shadow-sm">
              <span className="text-orange-500 flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm.93 12.412h-1.86v-1.86h1.86v1.86zm0-3.72h-1.86V7.588h1.86v1.104z"/></svg>
              </span>
              <span className="font-semibold text-orange-700 mr-1">Reason:</span>
              <span className="text-gray-800 whitespace-pre-line">{selectedNotification?.message.split("Reason:")[1]?.trim()}</span>
            </div>
          )}
          <div className="text-xs text-gray-400 text-right mt-2 mb-4">
            {selectedNotification?.time ? formatDistanceToNow(new Date(selectedNotification.time), { addSuffix: true }) : ""}
          </div>
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-500 mb-2">For any questions, please contact admin for support.</div>
            <button
              className="inline-block px-5 py-2 rounded-md bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition"
              onClick={() => setOpenHelpModal(true)}
            >
              Contact Support
            </button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal hỗ trợ giống BannedOverlay */}
      <Dialog open={openHelpModal} onOpenChange={setOpenHelpModal}>
        <DialogContent className="max-w-md">
          <DialogTitle>Contact Support</DialogTitle>
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition"
            onClick={() => setOpenHelpModal(false)}
            aria-label="Close"
            style={{ right: 16, top: 16, position: 'absolute' }}
          >
            <X className="w-6 h-6" />
          </button>
          <div className="flex flex-col items-center mb-4">
            <MessageSquare className="w-12 h-12 text-emerald-500 mb-2" />
            <h3 className="text-2xl font-bold mb-1 text-gray-800">Contact Support</h3>
            <p className="mb-4 text-gray-500 text-center">
              You can contact us via the following channels:
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
              <Phone className="w-6 h-6 text-emerald-500" />
              <a href="tel:+15551234567" className="font-medium text-gray-700 hover:underline">
                +1 (555) 123-4567
              </a>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50">
              <Mail className="w-6 h-6 text-emerald-500" />
              <a href="mailto:support@example.com" className="font-medium text-gray-700 hover:underline">
                support@example.com
              </a>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
