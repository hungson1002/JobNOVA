"use client";

import Link from "next/link"
import { ArrowLeft, Calendar, Clock, Download, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  // Mock order data
  type FileAttachment = { name: string; size: string }

  const order = {
    id: params.id,
    title: "Professional Logo Design",
    seller: "designpro",
    status: "in_progress",
    price: 85,
    created: "May 5, 2025",
    delivery: "May 12, 2025",
    description:
      "I will create a modern, professional logo for your business with unlimited revisions until you're satisfied.",
    requirements: "Please provide your business name, industry, and any color preferences you have.",
    attachments: [
      { name: "brief.pdf", size: "1.2 MB" },
      { name: "reference.jpg", size: "0.8 MB" },
    ] as FileAttachment[],
    deliverables: [] as FileAttachment[],
    messages: 8,
  }

  const [orderState, setOrderState] = useState(order.status)

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
            Pending
          </Badge>
        )
      case "in_progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            In Progress
          </Badge>
        )
      case "delivered":
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
            Delivered
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            Completed
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // Handler xác nhận thanh toán
  const handleConfirmPayment = async () => {
    try {
      const res = await fetch(`http://localhost:8800/api/orders/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setOrderState("completed");
    } catch {}
  };

  // Handler hủy đơn
  const handleCancelOrder = async () => {
    try {
      const res = await fetch(`http://localhost:8800/api/orders/${order.id}/cancel`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) setOrderState("completed");
    } catch {}
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Link href="/orders" className="mr-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Order Details</h1>
        <div className="ml-auto">{renderStatusBadge(orderState)}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{order.title}</CardTitle>
              <div className="text-sm text-gray-500">Order #{order.id}</div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">Ordered: {order.created}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-500" />
                  <span className="text-sm">Delivery by: {order.delivery}</span>
                </div>
              </div>

              <h3 className="font-medium mb-2">Description</h3>
              <p className="text-gray-600 mb-6">{order.description}</p>

              <h3 className="font-medium mb-2">Requirements</h3>
              <p className="text-gray-600 mb-6">{order.requirements}</p>

              <h3 className="font-medium mb-4">Your Attachments</h3>
              {order.attachments.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {order.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{file.name}</span>
                        <span className="ml-2 text-xs text-gray-500">{file.size}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-6">No attachments provided</p>
              )}

              <Separator className="my-6" />

              <h3 className="font-medium mb-4">Deliverables</h3>
              {order.deliverables.length > 0 ? (
                <div className="space-y-2 mb-6">
                  {order.deliverables.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{file.name}</span>
                        <span className="ml-2 text-xs text-gray-500">{file.size}</span>
                      </div>
                      <Button variant="ghost" size="sm">
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mb-6">No deliverables yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller</span>
                  <Link href={`/users/${order.seller}`} className="font-medium text-emerald-600 hover:underline">
                    @{order.seller}
                  </Link>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Package</span>
                  <span className="font-medium">Standard</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Time</span>
                  <span className="font-medium">7 days</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold">${order.price}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Link href={`/messages?order=${order.id}`}>
                <Button className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Message Seller
                </Button>
              </Link>

              {orderState === "delivered" && (
                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    Accept Delivery
                  </Button>
                  <div className="text-xs text-center mt-2 text-gray-500">
                    Accepting delivery will complete this order
                  </div>
                </div>
              )}

              {orderState === "in_progress" && (
                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    Request Modification
                  </Button>
                </div>
              )}

              {orderState === "pending" && (
                <div className="mt-4 flex flex-col gap-2">
                  <Button variant="outline" className="w-full" onClick={handleConfirmPayment}>
                    Confirm Payment
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={handleCancelOrder}>
                    Cancel Order
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
