"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { ReviewForm } from "@/components/review-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageParams {
  id: string;
}

export default async function ReviewPage({ params }: { params: Promise<PageParams> }) {
  const resolvedParams = await params;
  const orderId = resolvedParams.id;
  // Hooks must be called inside the component body, so move the rest into a child component
  return <ReviewPageInner orderId={orderId} />;
}

// Move the rest of the logic into a client component
function ReviewPageInner({ orderId }: { orderId: string }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const fetchOrder = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        const res = await fetch(`http://localhost:8800/api/orders/${user.id}?order_id=${orderId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (data.success && data.orders.length > 0) {
          setOrder(data.orders[0]);
        } else {
          setError("Order not found");
        }
      } catch (err) {
        setError("Failed to fetch order");
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [isLoaded, isSignedIn, user, getToken, orderId]);

  const handleSubmit = async (reviewData: {
    rating: number;
    comment: string;
    sellerCommunication: number;
    qualityOfDelivery: number;
    valueOfDelivery: number;
  }) => {
    try {
      const token = await getToken();
      const method = order.review ? "PATCH" : "POST";
      const url = order.review
        ? `http://localhost:8800/api/reviews/${order.review.id}`
        : `http://localhost:8800/api/reviews`;
      const body = order.review
        ? reviewData
        : {
            order_id: orderId,
            gig_id: order.gig_id,
            reviewer_clerk_id: user?.id ?? "",
            ...reviewData,
          };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to submit review");
      router.push("/orders");
    } catch (error) {
      console.error("Error submitting review:", error);
      setError("Failed to submit review");
    }
  };

  if (!isLoaded) return <div className="container mx-auto py-8">Loading...</div>;
  if (!isSignedIn) return <div className="container mx-auto py-8">Please sign in to review</div>;
  if (loading) return <div className="container mx-auto py-8">Loading order...</div>;
  if (error) return <div className="container mx-auto py-8">{error}</div>;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.push("/orders")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold">Review Order #{order.id}</h1>
      </div>
      <div className="max-w-2xl mx-auto">
        <ReviewForm
          onSubmit={handleSubmit}
          initialReview={order.review}
          buyerInfo={{
            name: order.buyer?.name || "User",
            country: order.buyer?.country || "Unknown",
            price: order.total_price,
            duration: order.duration,
          }}
        />
      </div>
    </main>
  );
}