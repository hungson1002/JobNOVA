"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Search, ChevronLeft, ChevronRight, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { ServiceCard } from "@/components/service-card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useCurrency } from "@/context/currency-context"
import { PriceDisplay } from "@/components/price-display"

// Định nghĩa type cho gig thật
interface Gig {
  id: number;
  seller_clerk_id: string;
  category_id: number;
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
  seller?: {
    name: string;
    avatar: string;
    level: string;
  };
  rating?: number;
  review_count?: number;
  isToprate?: number;
  created_at?: string;
}

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

  // Badge logic
  const badges = [];
  if (gig.created_at) {
    const createdAt = new Date(gig.created_at);
    const isNew = Date.now() - createdAt.getTime() < 7 * 24 * 60 * 60 * 1000;
    if (isNew) badges.push("new");
  }
  const isToprateNum = typeof gig.isToprate === 'string' ? Number(gig.isToprate) : gig.isToprate;
  if (isToprateNum === 1) badges.push("top_rated");

  return {
    id: gig.id,
    title: gig.title,
    price: gig.starting_price,
    image: mediaList[0],
    gig_images: mediaList,
    seller: {
      name: gig.seller?.name || gig.seller_clerk_id || "Người dùng",
      avatar: gig.seller?.avatar || "/placeholder.svg",
      level: gig.seller?.level || "Level 1 Seller",
    },
    rating: typeof gig.rating === "number" ? gig.rating : 0,
    reviewCount: typeof gig.review_count === "number" ? gig.review_count : 0,
    category: categoryName || "Uncategorized",
    deliveryTime: gig.delivery_time,
    badges,
    isSaved: false,
    isToprate: gig.isToprate,
  }
}

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { currency, convertPrice, getCurrencySymbol } = useCurrency()
  const [isLoading, setIsLoading] = useState(false)

  // Get initial values from URL parameters
  const initialQuery = searchParams.get("q") || ""
  const initialCategory = searchParams.get("category") || ""
  const initialMinPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 10
  const initialMaxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 500
  const initialDeliveryTime = searchParams.get("delivery") ? searchParams.get("delivery")!.split(",").map(Number) : []
  const initialSellerLevels = searchParams.get("seller") ? searchParams.get("seller")!.split(",") : []
  const initialSortOption = searchParams.get("sort") || "relevance"

  // State for search and filters
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [priceRange, setPriceRange] = useState<[number, number]>([initialMinPrice, initialMaxPrice])
  const [minPrice, setMinPrice] = useState(initialMinPrice.toString())
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice.toString())
  const [deliveryTime, setDeliveryTime] = useState<number[]>(initialDeliveryTime)
  const [sellerLevels, setSellerLevels] = useState<string[]>(initialSellerLevels)
  const [sortOption, setSortOption] = useState(initialSortOption)
  const [filteredResults, setFilteredResults] = useState<any[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [isClient, setIsClient] = useState(false)
  const resultsPerPage = 6

  // Thêm state và fetch API
  const [categories, setCategories] = useState<{ id: number; name: string; slug?: string }[]>([])
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loadingGigs, setLoadingGigs] = useState(true)

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

  useEffect(() => {
    setLoadingGigs(true)
    fetch("http://localhost:8800/api/gigs")
      .then(res => res.json())
      .then(data => {
        const gigsData = Array.isArray(data.gigs) ? data.gigs : Array.isArray(data) ? data : [];
        setGigs(gigsData);
      })
      .finally(() => setLoadingGigs(false))
  }, [])

  // Giá trị min/max gốc theo USD
  let minCurrency = Math.round(convertPrice(10))
  let maxCurrency = Math.round(convertPrice(1000))
  if (currency === 'VND') {
    minCurrency = 0
    maxCurrency = 30_000_000
  }

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Set loading state
    setIsLoading(true)
    
    // Reset current page when searching
    setCurrentPage(1)
    
    // Update URL with search parameters (will trigger the searchParams effect)
    updateSearchParams()
  }

  // Update URL with all current filters
  const updateSearchParams = () => {
    // Lấy các tham số URL hiện tại
    const params = new URLSearchParams(searchParams.toString())
    
    // Cập nhật các tham số theo trạng thái hiện tại
    if (searchQuery) params.set("q", searchQuery)
    else params.delete("q")
    
    if (selectedCategory) params.set("category", selectedCategory)
    else params.delete("category")
    
    params.set("minPrice", priceRange[0].toString())
    params.set("maxPrice", priceRange[1].toString())
    
    if (deliveryTime.length > 0) params.set("delivery", deliveryTime.join(","))
    else params.delete("delivery")
    
    if (sellerLevels.length > 0) params.set("seller", sellerLevels.join(","))
    else params.delete("seller")
    
    params.set("sort", sortOption)

    router.push(`/search?${params.toString()}`)
  }
  
  // Listen for URL search params changes
  useEffect(() => {
    setIsLoading(true)  // Set loading state when params change
    
    const query = searchParams.get("q") || ""
    const category = searchParams.get("category") || ""
    const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : 10
    const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : 500
    const delivery = searchParams.get("delivery") ? searchParams.get("delivery")!.split(",").map(Number) : []
    const seller = searchParams.get("seller") ? searchParams.get("seller")!.split(",") : []
    const sort = searchParams.get("sort") || "relevance"

    // Update state with URL params
    setSearchQuery(query)
    setSelectedCategory(category)
    setPriceRange([minPrice, maxPrice])
    setMinPrice(minPrice.toString())
    setMaxPrice(maxPrice.toString())
    setDeliveryTime(delivery)
    setSellerLevels(seller)
    setSortOption(sort)

    // We'll let the filters effect handle the actual filtering
    // after state is updated
  }, [searchParams])

  // Apply filters and update results whenever filter state changes
  useEffect(() => {
    setLoadingGigs(true)
    let services = gigs.map(mapGigToServiceCard)

    // Filter by search query
    if (searchQuery) {
      services = services.filter((service) => service.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }

    // Filter by category
    if (selectedCategory) {
      services = services.filter((service) => service.category === selectedCategory)
    }

    // Filter by price range
    services = services.filter((service) => {
      const priceConverted = convertPrice(service.price)
      return priceConverted >= priceRange[0] && priceConverted <= priceRange[1]
    })

    // Filter by delivery time
    if (deliveryTime.length > 0) {
      services = services.filter((service) => {
        if (deliveryTime.includes(1) && service.deliveryTime <= 1) return true
        if (deliveryTime.includes(3) && service.deliveryTime <= 3 && service.deliveryTime > 1) return true
        if (deliveryTime.includes(7) && service.deliveryTime <= 7 && service.deliveryTime > 3) return true
        if (deliveryTime.includes(0)) return true // Any time
        return false
      })
    }

    // Filter by seller level
    if (sellerLevels.length > 0) {
      services = services.filter((service) => {
        const level = service.seller.level.toLowerCase()
        if (sellerLevels.includes("top_rated") && level.includes("top rated")) return true
        if (sellerLevels.includes("level_2") && level.includes("level 2")) return true
        if (sellerLevels.includes("level_1") && level.includes("level 1")) return true
        if (sellerLevels.includes("new_seller") && level.includes("new")) return true
        return false
      })
    }

    // Filter by top rate
    if (sellerLevels.includes("top_rated")) {
      services = services.filter((service) => service.isToprate === 1)
    }

    // Sort results
    switch (sortOption) {
      case "rating":
        services.sort((a, b) => b.rating - a.rating)
        break
      case "price_low":
        services.sort((a, b) => a.price - b.price)
        break
      case "price_high":
        services.sort((a, b) => b.price - a.price)
        break
      case "newest":
        services.reverse()
        break
      default:
        break
    }

    setFilteredResults(services)
    setCurrentPage(1) // Reset to first page when filters change
    setIsLoading(false) // End loading state
  }, [gigs, searchQuery, selectedCategory, priceRange, deliveryTime, sellerLevels, sortOption, currency])

  // Khi currency thay đổi, cập nhật lại range nếu cần
  useEffect(() => {
    setPriceRange([minCurrency, maxCurrency])
    setMinPrice(minCurrency.toString())
    setMaxPrice(maxCurrency.toString())
  }, [currency])

  // Handle category checkbox change
  const handleCategoryChange = (categorySlug: string, checked: boolean) => {
    if (checked) {
      setSelectedCategory(categorySlug)
    } else if (selectedCategory === categorySlug) {
      setSelectedCategory("")
    }
  }

  // Handle delivery time checkbox change
  const handleDeliveryTimeChange = (days: number, checked: boolean) => {
    if (checked) {
      setDeliveryTime((prev) => [...prev, days])
    } else {
      setDeliveryTime((prev) => prev.filter((d) => d !== days))
    }
  }

  // Handle seller level checkbox change
  const handleSellerLevelChange = (level: string, checked: boolean) => {
    if (checked) {
      setSellerLevels((prev) => [...prev, level])
    } else {
      setSellerLevels((prev) => prev.filter((l) => l !== level))
    }
  }

  // Handle price slider change
  const handlePriceSliderChange = (values: number[]) => {
    setPriceRange([values[0], values[1]])
    setMinPrice(values[0].toString())
    setMaxPrice(values[1].toString())
  }

  // Handle min price input change
  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMinPrice(value)
    if (value && !isNaN(Number(value))) {
      setPriceRange([Number(value), priceRange[1]])
    }
  }

  // Handle max price input change
  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setMaxPrice(value)
    if (value && !isNaN(Number(value))) {
      setPriceRange([priceRange[0], Number(value)])
    }
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery("")
    setSelectedCategory("")
    setPriceRange([10, 500])
    setMinPrice("10")
    setMaxPrice("500")
    setDeliveryTime([])
    setSellerLevels([])
    setSortOption("relevance")

    // Update URL
    router.push("/search")
  }

  // Clear specific filter
  const clearFilter = (type: string) => {
    if (type === "search") {
      setSearchQuery("")
    } else if (type === "category") {
      setSelectedCategory("")
    } else if (type === "price") {
      setPriceRange([10, 500])
      setMinPrice("10")
      setMaxPrice("500")
    } else if (type === "delivery") {
      setDeliveryTime([])
    } else if (type === "seller") {
      setSellerLevels([])
    }

    // Update URL with remaining filters
    setTimeout(updateSearchParams, 0)
  }
  
  // Apply filters button click
  const applyFilters = () => {
    updateSearchParams()
  }

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / resultsPerPage)
  const paginatedResults = filteredResults.slice((currentPage - 1) * resultsPerPage, currentPage * resultsPerPage)

  // Get currency symbol
  const currencySymbol = isClient ? getCurrencySymbol() : "$"

  // Thêm hàm getCategoryName vào trong component để dùng được biến categories
  function getCategoryName(slugOrId: string): string {
    const found = categories.find(
      (cat: { id: number; name: string; slug?: string }) => (cat.slug && cat.slug === slugOrId) || String(cat.id) === slugOrId
    )
    return found ? found.name : slugOrId
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center">
        <Button variant="ghost" size="sm" className="mr-4" asChild>
          <Link
            href="/"
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <h1 className="text-3xl font-bold dark:text-white">Search Results</h1>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-10 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            className="pl-10 h-12 border-gray-300 dark:border-gray-700"
            placeholder="Search for services"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-12 px-6 bg-emerald-500 hover:bg-emerald-600">
          Search
        </Button>
      </form>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Filters Sidebar */}
        <div className="w-full lg:w-72">
          <div className="sticky top-20 rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold dark:text-white">Filters</h2>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            </div>

            <Accordion
              type="multiple"
              defaultValue={["category", "budget", "deliveryTime", "sellerDetails"]}
              className="space-y-2"
            >
              <AccordionItem value="category" className="border-b-0 pt-0">
                <AccordionTrigger className="py-3 text-base font-medium hover:no-underline dark:text-white">
                  Category
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-3">
                    {categories.map((cat) => (
                      <div key={cat.id} className="flex items-center space-x-3">
                        <Checkbox
                          id={`category-${cat.id}`}
                          checked={selectedCategory === (cat.slug || String(cat.id))}
                          onCheckedChange={(checked) => handleCategoryChange(cat.slug || String(cat.id), checked as boolean)}
                        />
                        <label
                          htmlFor={`category-${cat.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                        >
                          {cat.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="budget" className="border-b-0">
                <AccordionTrigger className="py-3 text-base font-medium hover:no-underline dark:text-white">
                  Budget
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-5">
                    <div>
                      <div className="mb-3 flex justify-between">
                        <span className="text-sm dark:text-gray-300">
                          Min: {currencySymbol}{minCurrency}
                        </span>
                        <span className="text-sm dark:text-gray-300">
                          Max: {currencySymbol}{maxCurrency}
                        </span>
                      </div>
                      <Slider
                        value={priceRange}
                        min={minCurrency}
                        max={maxCurrency}
                        step={currency === 'VND' ? 10000 : 10}
                        className="my-6"
                        onValueChange={handlePriceSliderChange}
                        minStepsBetweenThumbs={1}
                        defaultValue={[minCurrency, maxCurrency]}
                      />
                      <div className="flex items-center justify-between gap-4 mt-4">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {currencySymbol}
                          </span>
                          <Input
                            className="pl-7"
                            type="number"
                            placeholder="Min"
                            value={minPrice}
                            onChange={handleMinPriceChange}
                          />
                        </div>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                            {currencySymbol}
                          </span>
                          <Input
                            className="pl-7 min-w-[120px]"
                            type="number"
                            placeholder="Max"
                            value={maxPrice}
                            onChange={handleMaxPriceChange}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="deliveryTime" className="border-b-0">
                <AccordionTrigger className="py-3 text-base font-medium hover:no-underline dark:text-white">
                  Delivery Time
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="delivery-1"
                        checked={deliveryTime.includes(1)}
                        onCheckedChange={(checked) => handleDeliveryTimeChange(1, checked as boolean)}
                      />
                      <label
                        htmlFor="delivery-1"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                      >
                        Up to 1 day
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="delivery-3"
                        checked={deliveryTime.includes(3)}
                        onCheckedChange={(checked) => handleDeliveryTimeChange(3, checked as boolean)}
                      />
                      <label
                        htmlFor="delivery-3"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                      >
                        Up to 3 days
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="delivery-7"
                        checked={deliveryTime.includes(7)}
                        onCheckedChange={(checked) => handleDeliveryTimeChange(7, checked as boolean)}
                      />
                      <label
                        htmlFor="delivery-7"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                      >
                        Up to 7 days
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="delivery-any"
                        checked={deliveryTime.includes(0)}
                        onCheckedChange={(checked) => handleDeliveryTimeChange(0, checked as boolean)}
                      />
                      <label
                        htmlFor="delivery-any"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                      >
                        Any time
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="sellerDetails" className="border-b-0">
                <AccordionTrigger className="py-3 text-base font-medium hover:no-underline dark:text-white">
                  Top Rate
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="seller-topRated"
                        checked={sellerLevels.includes("top_rated")}
                        onCheckedChange={(checked) => handleSellerLevelChange("top_rated", checked as boolean)}
                      />
                      <label
                        htmlFor="seller-topRated"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-gray-300"
                      >
                        Top Rated Only
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Button className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600" onClick={applyFilters}>
              Apply Filters
            </Button>
          </div>
        </div>

        {/* Search Results */}
        <div className="flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold dark:text-white">
                {selectedCategory ? `${getCategoryName(selectedCategory)} Services` : "All Services"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{filteredResults.length} services available</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm dark:text-gray-300">Sort by:</span>
              <Select value={sortOption} onValueChange={(value) => setSortOption(value)}>
                <SelectTrigger className="w-[180px] h-10 border-gray-300 dark:border-gray-700">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Best Match</SelectItem>
                  <SelectItem value="rating">Highest Rating</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="newest">Newest Arrivals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery ||
            selectedCategory ||
            priceRange[0] !== 10 ||
            priceRange[1] !== 500 ||
            deliveryTime.length > 0 ||
            sellerLevels.length > 0) && (
            <div className="mb-6 flex flex-wrap gap-2">
              {searchQuery && (
                <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                  Search: {searchQuery}
                  <button
                    className="ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => clearFilter("search")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {selectedCategory && (
                <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                  Category: {getCategoryName(selectedCategory)}
                  <button
                    className="ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => clearFilter("category")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {(priceRange[0] !== 10 || priceRange[1] !== 500) && (
                <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                  Price: <PriceDisplay priceUSD={priceRange[0] / (currency === 'VND' ? 24000 : 1)} symbolOnly size="small" /> -{" "}
                  <PriceDisplay priceUSD={priceRange[1] / (currency === 'VND' ? 24000 : 1)} symbolOnly size="small" />
                  <button
                    className="ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => clearFilter("price")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {deliveryTime.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                  Delivery: {deliveryTime.includes(0) ? "Any time" : `Up to ${Math.max(...deliveryTime)} days`}
                  <button
                    className="ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => clearFilter("delivery")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              {sellerLevels.length > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1.5 text-sm">
                  Seller: {sellerLevels.length} selected
                  <button
                    className="ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={() => clearFilter("seller")}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Badge>
              )}
              <Button
                variant="link"
                size="sm"
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                onClick={clearAllFilters}
              >
                Clear All
              </Button>
            </div>
          )}

          {/* Results Grid or Loading State */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-500"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading results...</p>
            </div>
          ) : paginatedResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {paginatedResults.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  showCategory
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-3 dark:bg-gray-800">
                <Search className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mb-2 text-lg font-medium dark:text-white">No results found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filter criteria</p>
              <Button variant="outline" className="mt-4" onClick={clearAllFilters}>
                Clear all filters
              </Button>
            </div>
          )}

          {/* Pagination */}
          {filteredResults.length > 0 && (
            <div className="mt-10 flex justify-center">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className="h-9 w-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  // Show pages around current page
                  let pageNum = i + 1
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = currentPage - 3 + i
                    }
                    if (currentPage > totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    }
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      size="sm"
                      className={`h-9 w-9 p-0 ${
                        currentPage === pageNum
                          ? "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400"
                          : ""
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  )
                })}

                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0">
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
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
