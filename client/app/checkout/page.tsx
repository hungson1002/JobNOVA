"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Clock, Check } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser, useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PriceDisplay } from "@/components/price-display"

export default function CheckoutPage() {
  const [requirements, setRequirements] = useState("")
  const [gig, setGig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { getToken } = useAuth()

  const gigId = searchParams.get("gig")

  const getGigImage = () => {
    let images: string[] = [];
    if (Array.isArray(gig?.gig_images)) {
      images = gig.gig_images;
    } else if (typeof gig?.gig_images === "string") {
      try {
        const arr = JSON.parse(gig.gig_images);
        if (Array.isArray(arr)) images = arr;
      } catch {}
    }
    if (images.length > 0) {
      const firstImg = images.find((url) => !url.match(/\.(mp4|mov|avi|wmv)$/i));
      if (firstImg) return firstImg;
    }
    if (gig?.gig_image && typeof gig.gig_image === "string" && gig.gig_image.startsWith("http")) return gig.gig_image;
    return "/placeholder.svg";
  };

  useEffect(() => {
    if (!gigId) return
    setLoading(true)
    fetch(`http://localhost:8800/api/gigs/${gigId}`)
      .then(res => res.json())
      .then(async data => {
        const gigData = data.gig;
        // Nếu đã có seller đầy đủ thì dùng luôn
        if (gigData.seller && gigData.seller.avatar && (gigData.seller.firstname || gigData.seller.username)) {
          gigData.seller = {
            name: gigData.seller.firstname && gigData.seller.lastname
              ? gigData.seller.firstname + ' ' + gigData.seller.lastname
              : gigData.seller.firstname
              ? gigData.seller.firstname
              : gigData.seller.username
              ? gigData.seller.username
              : 'Seller',
            avatar: gigData.seller.avatar || '/placeholder.svg',
          };
        } else if (gigData.seller_clerk_id) {
          // Nếu thiếu thông tin seller, fetch thêm từ API user
          try {
            const userRes = await fetch(`http://localhost:8800/api/users/${gigData.seller_clerk_id}`);
            const userData = await userRes.json();
            gigData.seller = {
              name: userData.firstname && userData.lastname
                ? userData.firstname + ' ' + userData.lastname
                : userData.firstname
                ? userData.firstname
                : userData.username
                ? userData.username
                : 'Seller',
              avatar: userData.avatar || '/placeholder.svg',
            };
          } catch {
            gigData.seller = { name: 'Seller', avatar: '/placeholder.svg' };
          }
        } else {
          gigData.seller = { name: 'Seller', avatar: '/placeholder.svg' };
        }
        setGig(gigData);
      })
      .finally(() => setLoading(false))
  }, [gigId])

  if (loading) return <div>Loading...</div>
  if (!gig) return <div>Gig not found</div>

  const selectedPackage = gig.packages?.standard || {
    name: "Standard",
    price: gig.starting_price,
    deliveryTime: gig.delivery_time + " days",
    revisions: "Unlimited revisions",
    features: [
      "Logo transparency",
      "Vector file (SVG, EPS, AI)",
      "High resolution files",
      "Source file",
    ],
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = await getToken()
    if (!user) {
      toast.error("You must be signed in to order.")
      return
    }

    // 1. Tạo đơn hàng
    const orderRes = await fetch("http://localhost:8800/api/orders/payment-intent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        gig_id: gig.id,
        total_price: selectedPackage.price,
        order_date: new Date().toISOString(),
        delivery_deadline: null,
        requirements,
      }),
    })
    const orderData = await orderRes.json()

    if (!orderData.success || !orderData.orderId) {
      if (orderData.message === 'You cannot order your own service.') {
        toast.error("You cannot order your own service.")
      } else {
        toast.error("There was an error creating your order. Please try again.")
      }
      return
    }

    // 2. Tạo link QR từ orderId
    const qrRes = await fetch("http://localhost:8800/api/payments/create-qr", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ orderId: orderData.orderId }),
    })
    const qrUrl = await qrRes.json()

    if (qrRes.ok && typeof qrUrl === "string") {
      window.location.href = qrUrl
    } else {
      toast.error("Could not create payment link. Please try again.")
    }
  }

  return (
    <main className="flex-1 bg-gray-50 py-8">
      <div className="container px-4">
        <div className="mb-6">
          <Link
            href={`/gigs/${gig.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-emerald-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to service
          </Link>
        </div>
        <h1 className="mb-8 text-2xl font-bold md:text-3xl">Complete Your Order</h1>
        <div className="flex flex-col gap-8 lg:flex-row">
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="rounded-lg border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-xl font-semibold">Order Requirements</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="requirements" className="mb-2 block">
                      Tell the seller what you need
                    </Label>
                    <Textarea
                      id="requirements"
                      placeholder="Describe your project in detail, including any specific requirements or preferences..."
                      className="min-h-[150px]"
                      value={requirements}
                      onChange={(e) => setRequirements(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600">
                Continue to Payment
              </Button>
            </form>
          </div>
          <div className="w-full lg:w-[380px]">
            <div className="sticky top-8 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold">Order Summary</h2>
              <div className="mb-4 flex gap-4">
                <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={getGigImage()}
                    alt={gig.title}
                    width={150}
                    height={100}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-medium line-clamp-2">{gig.title}</h3>
                  <div className="mt-1 flex items-center text-sm text-gray-600">
                    <Image
                      src={gig.seller?.avatar || "/placeholder.svg"}
                      alt={gig.seller?.name || "Seller"}
                      width={16}
                      height={16}
                      className="mr-1 rounded-full"
                    />
                    <span>{gig.seller?.name || "Seller"}</span>
                  </div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{selectedPackage.name} Package</span>
                  <span className="font-bold">
                    <PriceDisplay priceUSD={selectedPackage.price} />
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>{selectedPackage.deliveryTime} delivery</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">{selectedPackage.revisions}</div>
              </div>
              <Separator className="my-4" />
              <div className="mb-4">
                <h4 className="mb-2 font-medium">What's included:</h4>
                <ul className="space-y-2">
                  {(selectedPackage.features || []).map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator className="my-4" />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span><PriceDisplay priceUSD={selectedPackage.price} /></span>
                </div>
                <div className="flex justify-between">
                  <span>Service fee</span>
                  <span><PriceDisplay priceUSD={selectedPackage.price * 0.05} /></span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span><PriceDisplay priceUSD={selectedPackage.price * 1.05} /></span>
                </div>
              </div>
              <div className="mt-6 text-xs text-gray-500">
                By clicking "Continue to Payment", you agree to our Terms of Service and acknowledge that you have read our Privacy Policy.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}