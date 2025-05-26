"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

interface ReviewFormProps {
  orderId: number;
  gigId: number;
  buyerInfo: {
    name: string;
    country: string;
    price: number;
    duration: number;
  };
  onReviewSuccess?: () => void;
  onSubmit?: (data: {
    rating: number;
    comment: string;
    sellerCommunication: number;
    qualityOfDelivery: number;
    valueOfDelivery: number;
  }) => Promise<void>;
  initialReview?: {
    rating: number;
    comment: string;
    sellerCommunication: number;
    qualityOfDelivery: number;
    valueOfDelivery: number;
  };
}

export function ReviewForm({ orderId, gigId, buyerInfo, onReviewSuccess, onSubmit, initialReview }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredOverall, setHoveredOverall] = useState(0);
  const [hoveredCommunication, setHoveredCommunication] = useState(0);
  const [hoveredQuality, setHoveredQuality] = useState(0);
  const [hoveredValue, setHoveredValue] = useState(0);
  const [comment, setComment] = useState("");
  const [sellerCommunication, setSellerCommunication] = useState(0);
  const [qualityOfDelivery, setQualityOfDelivery] = useState(0);
  const [valueOfDelivery, setValueOfDelivery] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    if (initialReview) {
      setRating(initialReview.rating);
      setComment(initialReview.comment);
      setSellerCommunication(initialReview.sellerCommunication);
      setQualityOfDelivery(initialReview.qualityOfDelivery);
      setValueOfDelivery(initialReview.valueOfDelivery);
    }
  }, [initialReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || !orderId || !gigId) return;
    setIsSubmitting(true);

    try {
      if (onSubmit) {
        await onSubmit({
          rating,
          comment,
          sellerCommunication,
          qualityOfDelivery,
          valueOfDelivery,
        });
        if (onReviewSuccess) onReviewSuccess();
        setIsSubmitting(false);
        return;
      }

      const token = await getToken?.();
      const res = await fetch(`http://localhost:8800/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          order_id: orderId,
          gig_id: gigId,
          rating,
          comment,
          sellerCommunication,
          qualityOfDelivery,
          valueOfDelivery,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Tạo đánh giá thất bại");
      toast.success("Review submitted successfully!");
      if (onReviewSuccess) onReviewSuccess();

      // Reset form
      setRating(0);
      setComment("");
      setSellerCommunication(1);
      setQualityOfDelivery(1);
      setValueOfDelivery(1);
    } catch (error) {
      console.error("❌ Error submitting review:", error);
      toast.error(String(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    currentRating: number,
    setRating: (rating: number) => void,
    hovered: number,
    setHovered: (rating: number) => void,
    label?: string
  ) => (
    <div className="flex items-center gap-2 mt-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
          aria-label={label ? `${label} ${star} stars` : `${star} stars`}
        >
          <Star
            className={`h-7 w-7 ${star <= (hovered || currentRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} transition-colors`}
          />
        </button>
      ))}
      {currentRating > 0 && (
        <span className="ml-2 text-xs text-emerald-600 font-medium">{currentRating} / 5</span>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-lg p-8 space-y-7">
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-1">Review Gig</h3>
        <div className="text-sm text-gray-500 mb-2">
          <span className="font-medium text-gray-700">{buyerInfo.name}</span> ({buyerInfo.country})
        </div>
        <div className="text-xs text-gray-400 mb-2">
          Up to ${buyerInfo.price} • Duration {buyerInfo.duration} days
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Overall Rating <span className="text-gray-400 font-normal">(Chất lượng tổng thể)</span>
        </label>
        {renderStars(rating, setRating, hoveredOverall, setHoveredOverall, "Overall Rating")}
        <div className="text-xs text-gray-400 mt-1">Đánh giá tổng thể về dịch vụ này.</div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Seller Communication <span className="text-gray-400 font-normal">(Giao tiếp)</span>
        </label>
        {renderStars(sellerCommunication, setSellerCommunication, hoveredCommunication, setHoveredCommunication, "Seller Communication")}
        <div className="text-xs text-gray-400 mt-1">Người bán phản hồi nhanh, lịch sự, hỗ trợ tốt?</div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Quality of Delivery <span className="text-gray-400 font-normal">(Chất lượng giao hàng)</span>
        </label>
        {renderStars(qualityOfDelivery, setQualityOfDelivery, hoveredQuality, setHoveredQuality, "Quality of Delivery")}
        <div className="text-xs text-gray-400 mt-1">Sản phẩm giao đúng cam kết, chất lượng tốt?</div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Value of Delivery <span className="text-gray-400 font-normal">(Giá trị nhận được)</span>
        </label>
        {renderStars(valueOfDelivery, setValueOfDelivery, hoveredValue, setHoveredValue, "Value of Delivery")}
        <div className="text-xs text-gray-400 mt-1">Bạn cảm thấy số tiền bỏ ra có xứng đáng?</div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-semibold text-gray-700 mb-1">
          Comment <span className="text-gray-400 font-normal">(Chia sẻ trải nghiệm của bạn)</span>
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Hãy chia sẻ trải nghiệm thực tế của bạn về dịch vụ này..."
          className="mt-1 min-h-[100px] rounded-lg border border-gray-200 focus:ring-emerald-400 focus:border-emerald-400"
        />
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || isSubmitting}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-base font-semibold py-3 rounded-lg shadow-md transition-all"
      >
        {isSubmitting ? "Submitting..." : "Submit Review"}
      </Button>
    </form>
  );
}
