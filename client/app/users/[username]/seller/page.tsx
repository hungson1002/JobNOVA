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
import AboutSection from '@/components/profile/AboutSection';
import CertificationSection from '@/components/profile/CertificationSection';
import EducationSection from '@/components/profile/EducationSection';
import ProfileHeader from '@/components/profile/ProfileHeader';
import SkillsSection from '@/components/profile/SkillsSection';

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

async function getPortfolios(clerkId: string): Promise<any[]> {
  try {
    const res = await fetch(`http://localhost:8800/api/portfolios/${clerkId}`);
    if (!res.ok) return [];
    const data = await res.json();
    let portfoliosData: any[] = [];
    if (Array.isArray(data.portfolios)) {
      portfoliosData = data.portfolios;
    } else if (Array.isArray(data.data)) {
      portfoliosData = data.data;
    } else if (Array.isArray(data)) {
      portfoliosData = data;
    }
    return portfoliosData.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      portfolio_images: p.portfolio_images || [],
      category: p.category ? { id: p.category.id, name: p.category.name } : (p.Category ? { id: p.Category.id, name: p.Category.name } : undefined),
      gig: p.gig ? { id: p.gig.id, title: p.gig.title } : (p.Gig ? { id: p.Gig.id, title: p.Gig.title } : undefined),
    }));
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    return [];
  }
}

async function getGigs(clerkId: string): Promise<any[]> {
  try {
    const res = await fetch(`http://localhost:8800/api/gigs?seller_clerk_id=${clerkId}&limit=100`);
    if (!res.ok) return [];
    const data = await res.json();
    let gigsData: any[] = [];
    if (Array.isArray(data.gigs)) {
      gigsData = data.gigs;
    } else if (Array.isArray(data.data)) {
      gigsData = data.data;
    } else if (Array.isArray(data)) {
      gigsData = data;
    }
    return gigsData.map(gig => ({
      ...gig,
      price: typeof gig.price === 'number'
        ? gig.price
        : (typeof gig.starting_price === 'number' ? gig.starting_price : 0)
    }));
  } catch (error) {
    console.error('Error fetching gigs:', error);
    return [];
  }
}

export default function SellerProfilePage() {
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const [profileUser, setProfileUser] = useState<any>(null);
  const [portfolios, setPortfolios] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);

  useEffect(() => {
    getUser(username).then(setProfileUser);
  }, [username]);

  useEffect(() => {
    if (profileUser?.clerk_id) {
      getPortfolios(profileUser.clerk_id).then(data => {
        console.log("Fetched portfolios:", data);
        setPortfolios(data);
      });
      getGigs(profileUser.clerk_id).then(gigsData => {
        const safeGigs = gigsData.map(gig => ({
          ...gig,
          price: typeof gig.price === 'number'
            ? gig.price
            : (typeof gig.starting_price === 'number' ? gig.starting_price : 0)
        }));
        setGigs(safeGigs);
      });
    }
  }, [profileUser]);

  const isOwner = user?.username === username;

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

  return (
    <main className="flex-1 bg-gray-50 py-8">
      <div className="container px-4">
        {/* Profile Header */}
        <div className="mb-8">
          <ProfileHeader profile={profileUser} isOwner={isOwner} />
        </div>

        {/* Profile Content */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Column - About & Info */}
          <div className="w-full lg:w-1/3">
            {/* About Section */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <AboutSection profile={profileUser} isOwner={isOwner} onUpdated={() => getUser(username).then(setProfileUser)} />
            </div>
            {/* Portfolio */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Portfolio</h2>
              <PortfolioGrid
                portfolios={portfolios}
                clerkId={profileUser.clerk_id}
                isOwner={isOwner}
                isSeller={true}
                username={profileUser.name}
              />
            </div>
            {/* Languages */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Languages</h2>
              {profileUser.languages?.length > 0 ? (
                <ul className="space-y-3">
                  {profileUser.languages.map((language: any) => (
                    <li key={language.name} className="flex justify-between">
                      <span>{language.name}</span>
                      <span className="text-gray-600">{language.level}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No languages specified</p>
              )}
            </div>
            {/* Skills Section */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <SkillsSection clerkId={profileUser.clerk_id} />
            </div>
            {/* Education Section */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <EducationSection clerkId={profileUser.clerk_id} />
            </div>
            {/* Certifications Section */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <CertificationSection clerkId={profileUser.clerk_id} />
            </div>
          </div>

          {/* Right Column - Gigs & Reviews */}
          <div className="flex-1">
            <Tabs defaultValue="gigs" className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
                <TabsTrigger value="gigs">Gigs</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="gigs">
                <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
                  <h2 className="mb-4 text-xl font-bold">Gigs</h2>
                  {gigs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {gigs.map((gig: any) => (
                        <ServiceCard key={gig.id} service={gig} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No gigs available</p>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="reviews">
                <div className="rounded-lg border bg-white p-6 shadow-sm">
                  <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Reviews</h2>
                    {profileUser.rating && (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                          <span className="ml-1 font-medium">{profileUser.rating}</span>
                        </div>
                        <span className="text-gray-600">({profileUser.reviewCount || 0} reviews)</span>
                      </div>
                    )}
                  </div>

                  {profileUser.reviews?.length > 0 ? (
                    <div className="space-y-6">
                      {profileUser.reviews.map((review: any) => (
                        <div key={review.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                          <div className="mb-3 flex items-center gap-3">
                            <Image
                              src={review.buyer.avatar || "/placeholder.svg"}
                              alt={review.buyer.name}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                            <div>
                              <div className="font-medium">{review.buyer.name}</div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className="ml-1">{review.rating}</span>
                                </div>
                                <span>|</span>
                                <span>{review.date}</span>
                              </div>
                            </div>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No reviews available</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
} 