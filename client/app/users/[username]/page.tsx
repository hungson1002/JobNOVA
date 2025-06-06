"use client";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, MapPin, Flag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceCard } from "@/components/service-card";
import { PortfolioGrid } from "@/components/portfolio-grid";

async function getUser(username: string): Promise<any> {
  try {
    const userRes = await fetch(`http://localhost:8800/api/users/username/${username}`);
    if (!userRes.ok) return null;
    return userRes.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

async function getPortfolios(user: any): Promise<any[]> {
  try {
    const res = await fetch(`http://localhost:8800/api/portfolios/${user.clerk_id}`);
    if (!res.ok) return [];
    const data = await res.json();
    let portfoliosData: any[] = [];
    if (Array.isArray(data.portfolios)) {
      portfoliosData = data.portfolios;
    } else if (Array.isArray(data.data)) {
      portfoliosData = data.data;
    }
    return portfoliosData.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      portfolio_images: p.portfolio_images || [],
      category: p.Category ? { id: p.Category.id, name: p.Category.name } : undefined,
      gig: p.Gig ? { id: p.Gig.id, title: p.Gig.title } : undefined,
    }));
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }
}

export default function UserProfileLayout() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [profileUser, setProfileUser] = useState<any>(null);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser(username);
      setProfileUser(userData);
      setLoading(false);

      if (userData) {
        // Check if user has seller role
        const isSeller = userData.user_roles?.includes('employer');
        // Check if user has buyer role
        const isBuyer = userData.user_roles?.includes('seeker');

        // Redirect based on role
        if (isSeller) {
          router.push(`/users/${username}/seller`);
        } else if (isBuyer) {
          router.push(`/users/${username}/buyer`);
        } else {
          // If no role is found, default to buyer
          router.push(`/users/${username}/buyer`);
        }
      }
    };

    fetchUser();
  }, [username, router]);

  useEffect(() => {
    if (profileUser?.id) {
      console.log("Fetching portfolios for clerkId:", profileUser.id);
      getPortfolios(profileUser.id).then(data => {
        console.log("Fetched portfolios:", data);
        setPortfolios(data);
      });
    }
  }, [profileUser]);

  const isOwner = user?.username === username;

  if (loading) {
    return (
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container px-4 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          </div>
        </div>
      </main>
    );
  }

  if (!profileUser) {
    return (
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container px-4 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-gray-600">The user you're looking for doesn't exist or has been removed.</p>
          </div>
        </div>
      </main>
    );
  }

  

  return null; // This will be replaced by the role-specific page
}