"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { PortfolioForm } from "@/components/portfolio-form";

export default function CreatePortfolioPage() {
  const { userId, isLoaded, getToken } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [userGigs, setUserGigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      router.replace("/sign-in");
      return;
    }

    async function fetchData() {
      try {
        // Fetch categories
        const catRes = await fetch("http://localhost:8800/api/categories").then(res => res.json());
        setCategories(Array.isArray(catRes) ? catRes : catRes.categories || catRes.data || []);

        // Fetch gigs
        const gigsRes = await fetch(`http://localhost:8800/api/gigs?seller_clerk_id=${userId}`).then(res => res.json());
        setUserGigs(Array.isArray(gigsRes) ? gigsRes : gigsRes.gigs || gigsRes.data || []);
      } catch (e) {
        // handle error, show toast or message if needed
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [userId, isLoaded, router]);

  if (!isLoaded || loading) return <div>Loading...</div>;

  return (
    <main className="flex-1 bg-gray-50 py-8">
      <div className="container px-4">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Add New Project</h1>
            <p className="text-gray-600">Create a new portfolio project to showcase your work</p>
          </div>
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <PortfolioForm
              categories={categories}
              userGigs={userGigs}
              clerkId={userId!}
            />
          </div>
        </div>
      </div>
    </main>
  );
} 