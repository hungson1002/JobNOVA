"use client"

import type React from "react"
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs"
import { BarChart, Bell, Briefcase, Camera, ChevronLeft, ChevronRight, Code, Database, Heart, LayoutDashboard, MessageSquare, Music, Palette, PenTool, Search, ShoppingCart, Smile, Video } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

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
  const notifications: { title: string; time: string }[] = [] // Thay bằng dữ liệu thực tế nếu có
  const messages: { title: string; time: string }[] = [] // Thay bằng dữ liệu thực tế nếu có
  const isAdmin = user?.publicMetadata?.isAdmin
  const isSeller = user?.publicMetadata?.isSeller
  const isBuyer = user?.publicMetadata?.isBuyer

  // Mapping tên category sang icon
  const categoryIcons: Record<string, React.ReactNode> = {
    "Design": <Palette className="h-4 w-4" />,
    "Music": <Music className="h-4 w-4" />,
    "Video": <Video className="h-4 w-4" />,
    "Writing": <PenTool className="h-4 w-4" />,
    "Programming": <Code className="h-4 w-4" />,
    "Business": <BarChart className="h-4 w-4" />,
    "Marketing": <Briefcase className="h-4 w-4" />,
    "Photography": <Camera className="h-4 w-4" />,
    "Database": <Database className="h-4 w-4" />,
    "UI/UX": <Smile className="h-4 w-4" />,
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const currentParams = new URLSearchParams(window.location.search)
      currentParams.set("q", searchQuery.trim())

      // Lấy loại tiền tệ từ localStorage hoặc mặc định USD
      let currency = "USD"
      if (typeof window !== 'undefined') {
        currency = localStorage.getItem("currency") || "USD"
      }

      // Nếu không có minPrice/maxPrice thì thêm mặc định theo loại tiền tệ
      if (!currentParams.get("minPrice")) currentParams.set("minPrice", currency === "VND" ? "0" : "10")
      if (!currentParams.get("maxPrice")) currentParams.set("maxPrice", currency === "VND" ? "30000000" : "500")

      router.push(`/search?${currentParams.toString()}`)
    }
  }

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

  const handleLogout = () => {
    // Không cần clear role nữa vì chúng ta chỉ dùng publicMetadata
  }

  const getDashboardLink = () => {
    if (isAdmin) return "../admin/admin-dashboard"
    if (isSeller && isBuyer) return "/dashboard"
    if (isSeller) return "/dashboard/user"
    if (isBuyer) return "/dashboard/buyer"
    return "/dashboard"
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
      } else if ((isSeller || isBuyer || (isSeller && isBuyer)) && pathname === "/sign-in") {
        router.push("/");
      }
    }
  }, [isLoaded, isSignedIn, isAdmin, isSeller, isBuyer, pathname, router]);

  // Don't show navbar on role selection page
  if (pathname === "/select-role") {
    return null
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" prefetch className="mr-6 flex items-center space-x-2">
              <Image src="/logo.png" alt="Logo" width={32} height={32} />
              <span className="hidden font-bold sm:inline-block">JobNOVA</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center gap-4">
            <form onSubmit={handleSearch} className="relative flex-1 mx-4 flex">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-12 text-base rounded-md bg-background placeholder:text-muted-foreground/60 focus-visible:ring-2 focus-visible:ring-emerald-500 border"
              />
              <Button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 bg-emerald-500 text-white hover:bg-emerald-600 rounded-md"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex items-center gap-2 shrink-0">
              {!isLoaded ? (
                <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              ) : isSignedIn ? (
                <>
                  <LanguageCurrencySwitcher />
                  {user && getDashboardLink() && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={getDashboardLink()!} prefetch>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus:ring-0 focus-visible:ring-0 ring-0 outline-none"
                            >
                              <LayoutDashboard className="h-5 w-5" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Dashboard</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  {/* Notify Dropdown on hover - fix hover gap */}
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setOpenNotify(true)}
                    onMouseLeave={() => setOpenNotify(false)}
                  >
                    <DropdownMenu open={openNotify}>
                      <DropdownMenuTrigger asChild>
                        <Link href="/notifications" prefetch>
                          <Button
                            tabIndex={-1}
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 !outline-none !ring-0"
                            style={{ outline: "none", boxShadow: "none" }}
                          >
                            <Bell className="h-5 w-5" />
                          </Button>
                        </Link>
                      </DropdownMenuTrigger>
                      {openNotify && (
                        <div className="absolute top-full right-0 z-50 w-80 min-h-[400px] max-h-[700px] bg-white shadow-lg rounded-b-lg overflow-y-auto">
                          <div className="font-semibold px-4 py-2 border-b">Notifications</div>
                          {notifications.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No notifications</div>
                          ) : (
                            notifications.map((item, idx) => (
                              <div key={idx} className="whitespace-normal py-3 px-4 hover:bg-gray-100 cursor-pointer">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-xs text-gray-500">{item.time}</div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </DropdownMenu>
                  </div>

                  {/* Message Dropdown on hover - fix hover gap */}
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setOpenMsg(true)}
                    onMouseLeave={() => setOpenMsg(false)}
                  >
                    <DropdownMenu open={openMsg}>
                      <DropdownMenuTrigger asChild>
                        <Link href="/messages" prefetch>
                          <Button
                            tabIndex={-1}
                            variant="ghost"
                            size="icon"
                            className="hidden md:flex hover:bg-emerald-50 hover:text-emerald-600 transition-colors focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 !outline-none !ring-0"
                            style={{ outline: "none", boxShadow: "none" }}
                          >
                            <MessageSquare className="h-5 w-5" />
                          </Button>
                        </Link>
                      </DropdownMenuTrigger>
                      {openMsg && (
                        <div className="absolute top-full right-0 z-50 w-80 min-h-[400px] max-h-[700px] bg-white shadow-lg rounded-b-lg overflow-y-auto">
                          <div className="font-semibold px-4 py-2 border-b">Messages</div>
                          {messages.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">No messages</div>
                          ) : (
                            messages.map((item, idx) => (
                              <div key={idx} className="whitespace-normal py-3 px-4 hover:bg-gray-100 cursor-pointer">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-xs text-gray-500">{item.time}</div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </DropdownMenu>
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
                <div className="flex items-center gap-2">
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
