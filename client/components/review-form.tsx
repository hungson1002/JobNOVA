// "use client"

// import type React from "react"

// import { useState } from "react"
// import { Star } from "lucide-react"

// import { Button } from "@/components/ui/button"
// import { Textarea } from "@/components/ui/textarea"

// interface ReviewFormProps {
//   onSubmit?: (data: { rating: number; comment: string }) => void
//   className?: string
// }

// export function ReviewForm({ onSubmit, className }: ReviewFormProps) {
//   const [rating, setRating] = useState(0)
//   const [hoveredRating, setHoveredRating] = useState(0)
//   const [comment, setComment] = useState("")

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault()
//     if (rating === 0) return

//     onSubmit?.({ rating, comment })
//     // Reset form
//     setRating(0)
//     setComment("")
//   }

//   return (
//     <form onSubmit={handleSubmit} className={className}>
//       <h3 className="mb-4 text-lg font-semibold">Leave a Review</h3>

//       <div className="mb-4">
//         <p className="mb-2 text-sm font-medium">Rating</p>
//         <div className="flex items-center gap-1">
//           {[1, 2, 3, 4, 5].map((star) => (
//             <button
//               key={star}
//               type="button"
//               onClick={() => setRating(star)}
//               onMouseEnter={() => setHoveredRating(star)}
//               onMouseLeave={() => setHoveredRating(0)}
//               className="rounded-md p-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
//             >
//               <Star
//                 className={`h-6 w-6 ${
//                   star <= (hoveredRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
//                 } transition-colors`}
//               />
//             </button>
//           ))}
//           <span className="ml-2 text-sm text-gray-500">
//             {rating > 0 ? `${rating} out of 5 stars` : "Select a rating"}
//           </span>
//         </div>
//       </div>

//       <div className="mb-4">
//         <label htmlFor="review-comment" className="mb-2 block text-sm font-medium">
//           Your Review
//         </label>
//         <Textarea
//           id="review-comment"
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           placeholder="Share your experience with this service..."
//           className="min-h-[120px] resize-y"
//         />
//       </div>

//       <Button type="submit" disabled={rating === 0} className="bg-emerald-500 hover:bg-emerald-600">
//         Submit Review
//       </Button>
//     </form>
//   )
// }

"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ReviewFormProps {
  onSubmit: (review: {
    rating: number;
    comment: string;
    sellerCommunication: number;
    qualityOfDelivery: number;
    valueOfDelivery: number;
  }) => void;
  initialReview?: {
    rating: number;
    comment: string;
    sellerCommunication: number;
    qualityOfDelivery: number;
    valueOfDelivery: number;
  };
  buyerInfo: {
    name: string;
    country: string;
    price: number;
    duration: number;
  };
}

export function ReviewForm({ onSubmit, initialReview, buyerInfo }: ReviewFormProps) {
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(initialReview?.comment || "");
  const [sellerCommunication, setSellerCommunication] = useState(initialReview?.sellerCommunication || 0);
  const [qualityOfDelivery, setQualityOfDelivery] = useState(initialReview?.qualityOfDelivery || 0);
  const [valueOfDelivery, setValueOfDelivery] = useState(initialReview?.valueOfDelivery || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0 || sellerCommunication === 0 || qualityOfDelivery === 0 || valueOfDelivery === 0) return;
    onSubmit({ rating, comment, sellerCommunication, qualityOfDelivery, valueOfDelivery });
    setRating(0);
    setComment("");
    setSellerCommunication(0);
    setQualityOfDelivery(0);
    setValueOfDelivery(0);
  };

  const renderStars = (currentRating: number, setRating: (rating: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoveredRating(star)}
          onMouseLeave={() => setHoveredRating(0)}
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hoveredRating || currentRating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Review Gig</h3>
        <div className="mt-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">{buyerInfo.name}</span> ({buyerInfo.country})
          </p>
          <p>
            Up to ${buyerInfo.price} • Duration {buyerInfo.duration} days
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Overall Rating</label>
        {renderStars(rating, setRating)}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Seller Communication</label>
        {renderStars(sellerCommunication, setSellerCommunication)}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Quality of Delivery</label>
        {renderStars(qualityOfDelivery, setQualityOfDelivery)}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Value of Delivery</label>
        {renderStars(valueOfDelivery, setValueOfDelivery)}
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
          Comment
        </label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          className="mt-1"
        />
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || sellerCommunication === 0 || qualityOfDelivery === 0 || valueOfDelivery === 0}
        className="w-full bg-emerald-500 hover:bg-emerald-600"
      >
        {initialReview ? "Update Review" : "Submit Review"}
      </Button>
    </form>
  );
}