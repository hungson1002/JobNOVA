import Image from "next/image";
import { Star, ChevronDown, ChevronUp, MessageCircle, MoreVertical } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

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
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews)
  const [userVotes, setUserVotes] = useState<Record<string, "yes" | "no" | null>>({});
  const { getToken, userId } = useAuth();

  const [expandedResponses, setExpandedResponses] = useState<string[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleResponse = (reviewId: string) => {
    setExpandedResponses((prev) =>
      prev.includes(reviewId)
        ? prev.filter((id) => id !== reviewId)
        : [...prev, reviewId]
    );
  };

  const handleHelpfulVote = async (reviewId: string, vote: "yes" | "no") => {
    try {
      const token = await getToken?.();
      const res = await fetch(`http://localhost:8800/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ vote }),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update helpful vote");
      setLocalReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? {
                ...r,
                helpful: {
                  yes:
                    vote === "yes"
                      ? data.action === "removed"
                        ? r.helpful.yes - 1
                        : r.helpful.yes + 1
                      : r.helpful.yes,
                  no:
                    vote === "no"
                      ? data.action === "removed"
                        ? r.helpful.no - 1
                        : r.helpful.no + 1
                      : r.helpful.no,
                },
              }
            : r
        )
      );
      setUserVotes((prev) => ({
        ...prev,
        [reviewId]: data.action === "removed" ? null : vote,
      }));
    } catch (error) {
      console.error("❌ Error voting helpful:", error);
      alert(String(error));
    }
  };

  // Khi mount, fetch trạng thái vote của user cho từng review (nếu backend trả về, hoặc có thể fetch riêng)
  useEffect(() => {
    // Nếu backend trả về trạng thái vote của user, hãy set vào userVotes ở đây
    // Nếu chưa có, mặc định là null
    const votes: Record<string, "yes" | "no" | null> = {};
    setUserVotes(votes);
  }, [reviews, userId]);

  // Đóng menu khi click ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={className}>
      <h3 className="mb-4 text-xl font-bold text-gray-800">Customer Reviews</h3>

      {reviews.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-400 border-none">
          <MessageCircle className="w-10 h-10 mb-2" />
          <div className="font-medium">No reviews yet. Be the first to leave a review!</div>
        </div>
      ) : (
        <div className="space-y-8">
          {localReviews.map((review) => {
            const userVote = userVotes[review.id] || null;
            return (
              <div
                key={review.id}
                className="group relative flex gap-4 pb-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-shrink-0">
                  <Image
                    src={review.user.avatar || "/placeholder.svg"}
                    alt={review.user.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base text-gray-900 truncate">{review.user.name}</span>
                    <span className="text-xs text-gray-400">{review.date}</span>
                    <span className="ml-2 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                    </span>
                  </div>
                  <div className="mt-2 text-gray-800 text-sm break-words">{review.comment}</div>
                  {review.sellerResponse && (
                    <div className="mt-4 ml-8 flex gap-2 items-start bg-gray-50 border-l-4 border-emerald-300 rounded-md p-3">
                      <Image
                        src={review.seller.avatar}
                        alt={review.seller.name}
                        width={28}
                        height={28}
                        className="rounded-full border border-emerald-200 mt-1"
                      />
                      <div>
                        <span className="font-semibold text-emerald-700 text-sm">{review.seller.name}</span>
                        <div className="text-gray-700 text-sm mt-1">{review.sellerResponse}</div>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                    <span>Helpful?</span>
                    <button
                      onClick={() => handleHelpfulVote(review.id, "yes")}
                      className={`px-2 py-1 rounded-full border border-emerald-200 transition-colors ${userVote === "yes" ? "bg-emerald-100 text-emerald-700 font-bold" : "hover:bg-emerald-50 hover:text-emerald-600"}`}
                      disabled={userVote === "no"}
                    >
                      👍 {review.helpful?.yes ?? 0}
                    </button>
                    <button
                      onClick={() => handleHelpfulVote(review.id, "no")}
                      className={`px-2 py-1 rounded-full border border-red-200 transition-colors ${userVote === "no" ? "bg-red-100 text-red-700 font-bold" : "hover:bg-red-50 hover:text-red-600"}`}
                      disabled={userVote === "yes"}
                    >
                      👎 {review.helpful?.no ?? 0}
                    </button>
                  </div>
                </div>
                <div className="absolute top-2 right-3 z-10">
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setMenuOpenId(menuOpenId === review.id ? null : review.id)}
                    aria-label="More options"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-500" />
                  </button>
                  {menuOpenId === review.id && (
                    <div ref={menuRef} className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700">Edit</button>
                      <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600">Delete</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}