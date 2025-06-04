import Image from "next/image"
import { Star, MapPin, Flag, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ServiceCard } from "@/components/service-card"
import { PortfolioGrid } from "@/components/portfolio-grid"


// Sửa lại: fetch user hiện tại (current user)
async function getUser() {
  try {
    const userRes = await fetch(`http://localhost:8800/api/auth/me`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!userRes.ok) return null;
    return userRes.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Sửa lại: truyền vào user.id (profileUser.id)
async function getPortfolios(userId: string) {
  try {
    const res = await fetch(`http://localhost:8800/api/portfolios?seller_clerk_id=${userId}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    let portfoliosData = [];
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

export default async function UserProfilePage() {
  const profileUser = await getUser();
  const portfolios = profileUser?.id ? await getPortfolios(profileUser.id) : [];

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
        <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row">
            <div className="flex flex-col items-center md:items-start md:flex-row md:gap-6">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-md">
                <Image src={profileUser.avatar || "/placeholder.svg"} alt={profileUser.name || 'User'} fill className="object-cover" />
              </div>
              <div className="mt-4 text-center md:mt-0 md:text-left">
                <h1 className="text-2xl font-bold">{profileUser.name || 'No Name'}</h1>
                <p className="text-lg text-gray-600">@{profileUser.username || 'No Username'}</p>
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  {profileUser.rating && (
                    <>
                      <div className="flex items-center">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="ml-1 font-medium">{profileUser.rating}</span>
                        <span className="ml-1 text-gray-600">({profileUser.reviewCount || 0})</span>
                      </div>
                      <span className="text-gray-300">|</span>
                    </>
                  )}
                  {profileUser.location && (
                    <>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="mr-1 h-4 w-4" />
                        {profileUser.location}
                      </div>
                      <span className="text-gray-300">|</span>
                    </>
                  )}
                  {profileUser.memberSince && (
                    <div className="text-gray-600">Member since {profileUser.memberSince}</div>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-col gap-2 md:ml-auto md:mt-0">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                <MessageSquare className="mr-2 h-4 w-4" />
                Contact Me
              </Button>
              <Button variant="outline">
                <Flag className="mr-2 h-4 w-4" />
                Report User
              </Button>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left Column - About & Info */}
          <div className="w-full lg:w-1/3">
            {/* About Section */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">About Me</h2>
              <div className="space-y-4 text-gray-700">
                <p>{profileUser.about || 'No information available'}</p>
              </div>
            </div>

            {/* Portfolio */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Portfolio</h2>
              {portfolios.length > 0 ? (
                <PortfolioGrid
                  portfolios={portfolios}
                  clerkId={profileUser.id}
                  isOwner={true}
                  isSeller={profileUser.user_roles?.includes('seller')}
                />
              ) : (
                <p className="text-gray-500">No portfolio items available</p>
              )}
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

            {/* Skills */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Skills</h2>
              {profileUser.skills?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profileUser.skills.map((skill: string) => (
                    <span key={skill} className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No skills specified</p>
              )}
            </div>

            {/* Education */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Education</h2>
              {profileUser.education?.length > 0 ? (
                <ul className="space-y-4">
                  {profileUser.education.map((edu: any) => (
                    <li key={edu.degree} className="space-y-1">
                      <div className="font-medium">{edu.degree}</div>
                      <div className="text-gray-600">{edu.institution}</div>
                      <div className="text-sm text-gray-500">{edu.years}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No education information available</p>
              )}
            </div>

            {/* Certifications */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-bold">Certifications</h2>
              {profileUser.certifications?.length > 0 ? (
                <ul className="space-y-4">
                  {profileUser.certifications.map((cert: any) => (
                    <li key={cert.name} className="space-y-1">
                      <div className="font-medium">{cert.name}</div>
                      <div className="text-gray-600">{cert.issuer}</div>
                      <div className="text-sm text-gray-500">{cert.date}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No certifications available</p>
              )}
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
                {profileUser.gigs?.length > 0 ? (
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    {profileUser.gigs.map((gig: any) => (
                      <ServiceCard key={gig.id} service={gig} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-white p-6 shadow-sm">
                    <p className="text-gray-500">No gigs available</p>
                  </div>
                )}
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