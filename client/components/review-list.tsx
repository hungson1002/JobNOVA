import Image from "next/image";
import { Star, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Review {
  id: string;
  user: {
    name: string;
    avatar: string;
    country: string;
  };
  rating: number;
  date: string;
  comment: string;
  price: number;
  duration: number;
  sellerResponse: string | null;
  helpful: { yes: number; no: number };
  seller: {
    name: string;
    avatar: string;
  };
}

interface ReviewListProps {
  reviews: Review[];
  className?: string;
}

export function ReviewList({ reviews, className }: ReviewListProps) {
  const [expandedResponses, setExpandedResponses] = useState<string[]>([]);

  const toggleResponse = (reviewId: string) => {
    setExpandedResponses((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleHelpfulVote = async (reviewId: string, vote: "yes" | "no") => {
    try {
      const res = await fetch(`http://localhost:8800/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote }),
      });
      if (!res.ok) throw new Error("Failed to update helpful vote");
      // Sau khi cập nhật, có thể fetch lại reviews nếu cần
    } catch (error) {
      console.error("Error voting helpful:", error);
    }
  };

  return (
    <div className={className}>
      <h3 className="mb-4 text-lg font-semibold">Customer Reviews</h3>

      {reviews.length === 0 ? (
        <p className="text-gray-500">No reviews yet. Be the first to leave a review!</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <div className="mb-2 flex items-center gap-4">
                <div className="h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={review.user.avatar || "/placeholder.svg"}
                    alt={review.user.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-medium">
                    {review.user.name} <span className="text-sm text-gray-500">({review.user.country})</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${
                            star <= review.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300 dark:text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="mx-2">•</span>
                    <span>{review.date}</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
              <div className="mt-2 text-sm text-gray-500">
                Up to ${review.price} • Duration {review.duration} days
              </div>
              {review.sellerResponse && (
                <div className="mt-4">
                  <button
                    onClick={() => toggleResponse(review.id)}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-emerald-600"
                  >
                    Seller's Response
                    {expandedResponses.includes(review.id) ? (
                      <ChevronUp className="ml-1 h-4 w-4" />
                    ) : (
                      <ChevronDown className="ml-1 h-4 w-4" />
                    )}
                  </button>
                  {expandedResponses.includes(review.id) && (
                    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <div className="flex items-center gap-3">
                        <Image
                          src={review.seller.avatar}
                          alt={review.seller.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <p className="text-gray-700">{review.sellerResponse}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-4 flex items-center gap-3 text-sm text-gray-600">
                <span>Helpful?</span>
                <button
                  onClick={() => handleHelpfulVote(review.id, "yes")}
                  className="hover:text-emerald-600"
                >
                  Yes ({review.helpful.yes})
                </button>
                <button
                  onClick={() => handleHelpfulVote(review.id, "no")}
                  className="hover:text-emerald-600"
                >
                  No ({review.helpful.no})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}