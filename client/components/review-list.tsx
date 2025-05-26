import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth, useUser } from "@clerk/nextjs";
import { MessageCircle, MoreVertical, Star } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ReviewForm } from "./review-form";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Review {
  id: string;
  reviewer_clerk_id: string;
  user: {
    name: string;
    avatar: string;
    country: string;
  };
  rating: number;
  created_at: string;
  comment: string;
  price: number;
  duration: number;
  sellerResponse: string | null;
  helpful: { yes: number; no: number };
  seller: {
    name: string;
    avatar: string;
  };
  sellerCommunication: number;
  qualityOfDelivery: number;
  valueOfDelivery: number;
  seller_clerk_id: string;
  order_id: number;
  gig_id: number;
}

interface ReviewListProps {
  reviews: Review[];
  className?: string;
  onReviewUpdate?: (updatedReview?: Review) => void;
  onReviewDelete?: (reviewId: string) => void;
}

export function ReviewList({ reviews, className, onReviewUpdate, onReviewDelete }: ReviewListProps) {
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews)
  const [userVotes, setUserVotes] = useState<Record<string, "yes" | "no" | null>>({});
  const { getToken, userId } = useAuth();
  const { user } = useUser();
  const [expandedResponses, setExpandedResponses] = useState<string[]>([]);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // States for edit/delete modals
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

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
      if (!res.ok) {
        if (data.message === "Review not found") {
          setLocalReviews(prev => prev.filter(r => r.id !== reviewId));
        }
        throw new Error(data.message || "Failed to update helpful vote");
      }
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
    async function fetchUserVotes() {
      if (!userId) return;
      const votes: Record<string, "yes" | "no" | null> = {};
      await Promise.all(
        reviews.map(async (review) => {
          try {
            const token = await getToken?.();
            const res = await fetch(`http://localhost:8800/api/reviews/${review.id}/helpful-vote`, {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
              credentials: "include",
            });
            const data = await res.json();
            votes[review.id] = data.vote || null;
          } catch (err) {
            votes[review.id] = null;
          }
        })
      );
      setUserVotes(votes);
    }
    fetchUserVotes();
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

  const handleEditReview = async (reviewData: {
    rating: number;
    comment: string;
    sellerCommunication: number;
    qualityOfDelivery: number;
    valueOfDelivery: number;
  }) => {
    if (!editingReview) return;
    setIsSubmitting(true);
    console.log('[DEBUG][handleEditReview] called', { editingReview, reviewData });
    try {
      let reviewId = editingReview.id;
      if (typeof reviewId === 'string' && reviewId.includes('/')) {
        const parts = reviewId.split('/');
        reviewId = parts[parts.length - 1] || editingReview.id;
      }
      const url = `http://localhost:8800/api/reviews/${reviewId}`;
      console.log('[DEBUG][handleEditReview] PATCH URL:', url);
      console.log('[DEBUG][handleEditReview] PATCH BODY:', reviewData);
      const token = await getToken?.();
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify(reviewData),
      });
      const data = await res.json();
      console.log('[DEBUG][handleEditReview] PATCH response status:', res.status);
      console.log('[DEBUG][handleEditReview] PATCH response data:', data);
      if (!res.ok) throw new Error(data.message || "Update review failed");
      // Cập nhật lại local state nếu cần
      const updatedReview = {
        ...editingReview,
        ...reviewData,
        date: new Date().toISOString(), // hoặc dùng formatTimeAgo(new Date())
      };
      setLocalReviews(prev => prev.map(r => r.id === editingReview.id ? updatedReview : r));
      onReviewUpdate?.(updatedReview);
      setEditingReview(null);
      toast.success("Review updated!");
      if (onReviewUpdate) onReviewUpdate({ ...editingReview, ...reviewData });
    } catch (err) {
      console.error('[DEBUG][handleEditReview] Error:', err);
      toast.error(String(err));
    } finally {
      setIsSubmitting(false);
      console.log('[DEBUG][handleEditReview] done');
    }
  };

  const handleDeleteReview = async () => {
    if (!deletingReview) return;
    setIsSubmitting(true);
    try {
      // Đảm bảo id là số nguyên
      let reviewId = deletingReview.id;
      if (typeof reviewId === 'string' && reviewId.includes('/')) {
        const parts = reviewId.split('/');
        reviewId = parts[parts.length - 1] || deletingReview.id;
      }
      const url = `http://localhost:8800/api/reviews/${reviewId}`;
      console.log("[DEBUG] handleDeleteReview", { deletingReview, reviewId, url });
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          ...(await getToken?.() ? { Authorization: `Bearer ${await getToken?.()}` } : {}),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete review");
      setLocalReviews(prev =>
        prev.filter(review => review.id !== deletingReview.id)
      );
      onReviewDelete?.(deletingReview.id);
      setDeletingReview(null);
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm gửi reply
  const handleReplySubmit = async (reviewId: string) => {
    try {
      const token = await getToken?.();
      const res = await fetch(`http://localhost:8800/api/reviews/${reviewId}/seller-response`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ sellerResponse: replyContent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reply");
      setLocalReviews(prev => prev.map(r => r.id === reviewId ? { ...r, sellerResponse: replyContent } : r));
      setReplyingReviewId(null);
      setReplyContent("");
    } catch (error) {
      alert("Failed to reply review");
    }
  };

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
            const isOwner = userId === review.reviewer_clerk_id;
            const isGigOwner = !!user && user.id === review.seller_clerk_id;
            return (
              <div
                key={review.id}
                className="group relative flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-7 transition"
              >
                <div className="flex items-center gap-4">
                  <Image
                    src={review.user.avatar || "/placeholder.svg"}
                    alt={review.user.name}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-100 shadow-sm"
                  />
                  <div className="flex-1 min-w-0">
                    {/* Tên + Quốc gia */}
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base text-gray-900 truncate">{review.user.name}</span>
                      <div className="flex items-center text-xs text-gray-500 gap-1">
                        <img
                          src={`https://flagcdn.com/16x12/${(review.user.country || '').toLowerCase()}.png`}
                          alt={review.user.country}
                          className="inline-block w-4 h-3 object-cover rounded-sm border border-gray-200"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                        <div className="text-gray-400 text-xs opacity-75"> | </div>
                        {review.user.country}
                      </div>
                    </div>
                    {/* Rating + Thời gian */}
                    <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-gray-400 text-xs">•   {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                {/* Đường kẻ mảnh dưới rating */}
                <div className="border-b border-gray-200 mt-3 mb-2" />
                <div className="mt-2 text-gray-900 text-[15px] leading-relaxed break-words">{review.comment}</div>
                <div className="flex gap-8 mt-2 text-xs text-gray-600">
                  <div>
                    <span className="font-semibold">US${review.price}</span>
                    <span className="ml-1">Price</span>
                  </div>
                  <div className="text-gray-400 text-xs opacity-75"> | </div>
                  <div>
                    <span className="font-semibold">{review.duration} {review.duration > 1 ? 'days' : 'day'}</span>
                    <span className="ml-1">Duration</span>
                  </div>
                </div>
                {review.sellerResponse && (
                  <div className="mt-5 flex items-start gap-2 bg-yellow-50 border-l-4 border-yellow-400 rounded-md p-4 shadow-sm">
                    <Image
                      src={review.seller.avatar}
                      alt={review.seller.name}
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full border border-yellow-300 mt-1"
                    />
                    <div>
                      <span className="font-semibold text-yellow-700 text-sm">Seller's Response</span>
                      <div className="text-gray-700 text-sm mt-1 leading-relaxed">{review.sellerResponse}</div>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
                  <span className="font-medium">Helpful?</span>
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
                {isOwner && (
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
                        <button 
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-gray-700"
                          onClick={() => {
                            setEditingReview(review);
                            setMenuOpenId(null);
                          }}
                        >
                          Edit
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                          onClick={() => {
                            setDeletingReview(review);
                            setShowDeleteModal(true);
                            setMenuOpenId(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
                {/* Reply cho chủ gig */}
                {isGigOwner && !review.sellerResponse && (
                  <div className="mt-2">
                    {replyingReviewId === review.id ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          className="border rounded p-2 min-h-[40px]"
                          value={replyContent}
                          onChange={e => setReplyContent(e.target.value)}
                          placeholder="Nhập phản hồi cho khách hàng..."
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleReplySubmit(review.id)} disabled={!replyContent.trim()}>
                            Submit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => { setReplyingReviewId(null); setReplyContent(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => setReplyingReviewId(review.id)}>
                        Reply
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Review Modal */}
      {editingReview && (
        <Dialog open={!!editingReview} onOpenChange={() => setEditingReview(null)}>
          <DialogContent className="max-w-2xl max-h-[100vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Review</DialogTitle>
              <DialogDescription>
                Update your review for this service.
              </DialogDescription>
            </DialogHeader>
            <ReviewForm
              reviewId={editingReview.id}
              buyerInfo={{
                name: editingReview.user.name,
                country: editingReview.user.country,
                price: editingReview.price,
                duration: editingReview.duration,
              }}
              initialReview={{
                rating: editingReview.rating,
                comment: editingReview.comment,
                sellerCommunication: editingReview.sellerCommunication,
                qualityOfDelivery: editingReview.qualityOfDelivery,
                valueOfDelivery: editingReview.valueOfDelivery,
              }}
              onReviewSuccess={() => {
                setEditingReview(null);
                if (onReviewUpdate) onReviewUpdate();
              }}
              onSubmit={handleEditReview}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReview}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}