import { useEffect, useState } from 'react';

interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewer_clerk_id: string;
  createdAt: string;
  // ... các trường khác nếu cần
}

export default function ReviewsSection({ clerkId }: { clerkId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch tất cả review của user này
    fetch(`/api/reviews?clerk_id=${clerkId}`)
      .then(res => res.json())
      .then(data => {
        // Nếu API trả về { reviews: [...] }
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [clerkId]);

  if (loading) return <div>Loading reviews...</div>;
  if (!reviews.length) return <div className="text-gray-500">No reviews yet.</div>;

  return (
    <section>
      <h3 className="font-semibold text-lg mb-2">Reviews</h3>
      <ul className="space-y-2">
        {reviews.map(review => (
          <li key={review.id} className="border rounded p-2">
            <div className="font-medium">Rating: {review.rating}/5</div>
            <div className="text-gray-700">{review.comment}</div>
            <div className="text-xs text-gray-400">By: {review.reviewer_clerk_id} - {new Date(review.createdAt).toLocaleDateString()}</div>
          </li>
        ))}
      </ul>
    </section>
  );
}
