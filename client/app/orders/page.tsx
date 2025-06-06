"use client"

import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Clock, CheckCircle, AlertCircle, XCircle, RefreshCw, MessageSquare, ArrowLeft } from "lucide-react"
import { useUser, useAuth } from "@clerk/nextjs"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function OrdersPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [loadingConfirm, setLoadingConfirm] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return

    const fetchOrders = async () => {
      setLoading(true)
      try {
        const token = await getToken()
        console.log('Fetching orders for user:', user.id) // Debug log
        const res = await fetch(`http://localhost:8800/api/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        })
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        const data = await res.json()
        console.log('Orders API Response:', data) // Debug log
        if (Array.isArray(data)) {
          setOrders(data)
        } else if (data.orders && Array.isArray(data.orders)) {
          setOrders(data.orders)
        } else {
          console.error('Invalid orders data format:', data)
          setOrders([])
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
        setOrders([])
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [isLoaded, isSignedIn, user, getToken])

  const handleCancelUI = (orderId: number) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, order_status: "cancelled" } : o
      )
    )
  }

  if (!isLoaded) return <div className="container mx-auto py-8">Loading...</div>;
  if (!isSignedIn) return <div className="container mx-auto py-8">Please sign in to view your orders</div>;

  // Mapping orders by status
  const activeOrders = orders.filter(o => ["pending", "in_progress", "delivered"].includes(o.order_status));
  const completedOrders = orders.filter(o => ["completed", "delivered"].includes(o.order_status));
  const cancelledOrders = orders.filter(o => o.order_status === "cancelled");

  console.log('All Orders:', orders);
  console.log('Active Orders:', activeOrders);
  console.log('Completed Orders:', completedOrders);
  console.log('Cancelled Orders:', cancelledOrders);

  return (
    <main className="container mx-auto px-4 py-8">
      {loading ? (
        <div className="text-center py-16">Loading orders...</div>
      ) : (
        <>
          <div className="mb-8 flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-10 h-10 rounded border border-transparent hover:border-gray-300 hover:bg-gray-50 transition"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 text-black-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold">Manage Orders</h1>
              <p className="text-gray-600">Track and manage your orders</p>
            </div>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-4 md:w-auto">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-6">
              {orders.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-lg font-medium">
                  You have no orders yet.
                </div>
              ) : (
                orders.map((order) => (
                  <OrderCard key={order.id} order={order} onCancelClick={handleCancelUI} />
                ))
              )}
            </TabsContent>
            <TabsContent value="active" className="space-y-6">
              {activeOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-lg font-medium">
                  No active orders found.
                </div>
              ) : (
                activeOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onCancelClick={handleCancelUI} />
                ))
              )}
            </TabsContent>
            <TabsContent value="completed" className="space-y-6">
              {completedOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-lg font-medium">
                  No completed orders found.
                </div>
              ) : (
                completedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onCancelClick={handleCancelUI} />
                ))
              )}
            </TabsContent>
            <TabsContent value="cancelled" className="space-y-6">
              {cancelledOrders.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-lg font-medium">
                  No cancelled orders found.
                </div>
              ) : (
                cancelledOrders.map((order) => (
                  <OrderCard key={order.id} order={order} onCancelClick={handleCancelUI} />
                ))
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  );
}

function OrderCard({
  order,
  onCancelClick,
}: {
  order: any
  onCancelClick: (order: any) => void
}) {
  const gig = order.Gig || {}
  const seller = order.seller || {
    name: order.seller_clerk_id,
    avatar: "/placeholder.svg",
    level: "Seller",
  }

  const router = useRouter()
  const { getToken } = useAuth()
  const [loadingCancel, setLoadingCancel] = useState(false)
  const [loadingConfirm, setLoadingConfirm] = useState(false)
  const [showDialog, setShowDialog] = useState<null | "confirm" | "cancel">(null);
  const [pendingAction, setPendingAction] = useState<() => void>(() => () => {});

  const getGigImage = () => {
    let images: string[] = [];
    if (Array.isArray(gig.gig_images)) {
      images = gig.gig_images;
    } else if (typeof gig.gig_images === "string") {
      try {
        const arr = JSON.parse(gig.gig_images);
        if (Array.isArray(arr)) images = arr;
      } catch {}
    }
    if (images.length > 0) {
      const firstImg = images.find((url) => !url.match(/\.(mp4|mov|avi|wmv)$/i));
      if (firstImg) return firstImg;
    }
    if (gig.gig_image && typeof gig.gig_image === "string" && gig.gig_image.startsWith("http")) return gig.gig_image;
    return "/placeholder.svg";
  };

  const handleCancelOrder = async () => {
    setPendingAction(() => doCancelOrder);
    setShowDialog("cancel");
  };

  const doCancelOrder = async () => {
    setLoadingCancel(true);
    setShowDialog(null);
    try {
      const token = await getToken();
      const res = await fetch(
        `http://localhost:8800/api/orders/${order.id}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (res.ok) {
        onCancelClick(order.id);
        toast.success("Order cancelled successfully!");
      } else {
        toast.error(data?.message || "Failed to cancel order!");
      }
    } catch (err) {
      toast.error("An error occurred, please try again!");
    } finally {
      setLoadingCancel(false);
    }
  };

  const handleConfirmPayment = async () => {
    setPendingAction(() => doConfirmPayment);
    setShowDialog("confirm");
  };

  const doConfirmPayment = async () => {
    setLoadingConfirm(true);
    setShowDialog(null);
    try {
      const token = await getToken();
      const res = await fetch(`http://localhost:8800/api/orders/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: order.id }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        order.order_status = "completed";
        toast.success("Order confirmed and completed!");
        router.refresh();
      } else {
        toast.error(data?.message || "Failed to confirm payment!");
      }
    } catch {
      toast.error("Error confirming payment!");
    } finally {
      setLoadingConfirm(false);
    }
  };

  const handleMessageSeller = () => {
    router.push(`/messages?seller=${order.seller_clerk_id}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-400 text-white border-amber-400">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case "in_progress":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            <RefreshCw className="h-3 w-3" />
            In Progress
          </Badge>
        );
      case "delivered":
        return (
          <Badge
            variant="outline"
            className="border-emerald-500 text-emerald-500"
          >
            <CheckCircle className="h-3 w-3" />
            Delivered
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-500 text-white">
            <CheckCircle className="h-3 w-3" />
            Completed
          </Badge>
        );
      case "revision":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-500">
            <AlertCircle className="h-3 w-3" />
            Revision Requested
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500 text-white border-red-500">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getActionButtons = (status: string) => {
    switch (status) {
      case "delivered":
        return (
          <>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              Mark as Complete
            </Button>
            <Button variant="outline">Request Revision</Button>
          </>
        );
      case "in_progress":
        return (
          <>
            <Button variant="outline" onClick={handleMessageSeller}>
              Contact Seller
            </Button>
            <Button
              variant="outline"
              className="text-red-500 hover:bg-red-50"
              onClick={handleCancelOrder}
              disabled={loadingCancel}
            >
              {loadingCancel ? "Cancelling..." : "Cancel Order"}
            </Button>
          </>
        )
      case "pending":
        return (
          <>
            <Button
              className="bg-emerald-500 text-white hover:bg-emerald-600"
              size="sm"
              onClick={handleConfirmPayment}
              disabled={loadingConfirm}
            >
              {loadingConfirm ? "Confirming..." : "Confirm Payment"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelOrder}
              disabled={loadingCancel}
            >
              {loadingCancel ? "Cancelling..." : "Cancel Order"}
            </Button>
          </>
        );
      case "revision":
        return <Button variant="outline">View Revision Request</Button>;
      case "completed":
        return <Button variant="outline" onClick={() => gig.id && router.push(`/gigs/${gig.id}`)}>Leave a Review</Button>
      case "cancelled":
        return <Button variant="outline">View Details</Button>
      default:
        return null;
    }
  }

  return (
    <>
      <Card className="p-6 md:p-8 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex flex-col md:flex-row gap-6 flex-1">
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <img
                src={getGigImage()}
                alt={gig.title || "Gig"}
                width={96}
                height={96}
                style={{ objectFit: 'cover', borderRadius: '0.5rem', border: '1px solid #e5e7eb', width: 96, height: 96 }}
              />
              <span className="text-xs text-gray-400">Order #{order.id}</span>
            </div>
            <div className="flex flex-col justify-center gap-2 min-w-[180px]">
              <h2 className="text-xl font-bold mb-1">{gig.title || "Gig"}</h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-gray-500 text-sm">Seller:</span>
                <Image src={seller.avatar} alt={seller.name} width={28} height={28} className="rounded-full border w-8 h-8" />
                <span className="font-medium text-gray-800">{seller.name}</span>
                <span className="text-xs text-gray-400 ml-1">{seller.level}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 min-w-[220px] md:items-end">
            <div className="mb-2">{getStatusBadge(order.order_status)}</div>
            <div className="flex flex-col gap-1 text-sm text-gray-600">
              <div className="flex justify-between gap-2">
                <span>Order Date:</span>
                <span className="font-medium text-gray-900">{order.order_date ? format(new Date(order.order_date), "MMM d, yyyy") : "-"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Delivery Date:</span>
                <span className="font-medium text-gray-900">{order.delivery_deadline ? format(new Date(order.delivery_deadline), "MMM d, yyyy") : "-"}</span>
              </div>
            </div>
            <div className="mt-2 text-lg font-bold text-emerald-700 flex items-center gap-2">
              <span>Total:</span>
              <span className="text-2xl">${order.total_price}</span>
            </div>
          </div>
        </div>
        <CardFooter className="flex flex-wrap justify-between gap-2 mt-6 px-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/orders/${order.id}`}>View Details</Link>
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1" onClick={handleMessageSeller}>
              <MessageSquare className="h-4 w-4" />
              Message Seller
            </Button>
            {order.order_status !== "cancelled" && getActionButtons(order.order_status)}
          </div>
        </CardFooter>
      </Card>
      <Dialog open={!!showDialog} onOpenChange={v => setShowDialog(v ? showDialog : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {showDialog === "confirm" ? "Confirm Payment" : "Cancel Order"}
            </DialogTitle>
            <DialogDescription>
              {showDialog === "confirm"
                ? "Are you sure you want to confirm payment for this order?"
                : "Are you sure you want to cancel this order?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(null)}>
              Cancel
            </Button>
            <Button
              className={showDialog === "confirm" ? "bg-emerald-500 text-white hover:bg-emerald-600" : "bg-red-500 text-white hover:bg-red-600"}
              onClick={() => {
                if (pendingAction) pendingAction();
              }}
              disabled={loadingCancel || loadingConfirm}
            >
              {showDialog === "confirm"
                ? loadingConfirm ? "Confirming..." : "Confirm Payment"
                : loadingCancel ? "Cancelling..." : "Cancel Order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}