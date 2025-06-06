// "use client";
// import { useUser } from "@clerk/nextjs";
// import { useParams } from "next/navigation";
// import { useEffect, useState } from "react";
// import Image from "next/image";
// import { Star, MapPin, Flag, MessageSquare } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { CheckCircle2 } from "lucide-react";
// import ProfileHeader from "@/components/profile/ProfileHeader";
// import AboutSection from "@/components/profile/AboutSection";
// import LanguageSection from "@/components/profile/LanguageSection";
// import ProfileChecklist from "@/components/profile/ProfileChecklist";

// async function getUser(username: string): Promise<any> {
//   try {
//     const userRes = await fetch(`http://localhost:8800/api/users/username/${username}`);
//     if (!userRes.ok) return null;
//     return userRes.json();
//   } catch (error) {
//     console.error('Error fetching user:', error);
//     return null;
//   }
// }

// export default function BuyerProfilePage() {
//   const { user } = useUser();
//   const params = useParams();
//   const username = params.username as string;
//   const [profileUser, setProfileUser] = useState<any>(null);

//   useEffect(() => {
//     getUser(username).then(setProfileUser);
//   }, [username]);

//   const isOwner = user?.username === username;

//   if (!profileUser) {
//     return (
//       <main className="flex-1 bg-gray-50 py-8">
//         <div className="container px-4 flex flex-col items-center justify-center min-h-screen">
//           <div className="text-center">
//             <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
//             <p className="text-gray-600">The user you're looking for doesn't exist or has been removed.</p>
//           </div>
//         </div>
//       </main>
//     );
//   }

//   return (
//     <main className="flex-1 bg-gray-50 py-8">
//       <div className="container px-4">
//         {/* Profile Header */}
//         <div className="mb-8">
//           <ProfileHeader profile={profileUser} isOwner={isOwner} />
//         </div>

//         {/* Profile Content */}
//         <div className="flex flex-col gap-8 lg:flex-row">
//           {/* Left Column - About & Info */}
//           <div className="w-full lg:w-1/3">
//             {/* About Section */}
//             <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
//               <AboutSection profile={profileUser} isOwner={isOwner} onUpdated={() => getUser(username).then(setProfileUser)} />
//             </div>
//             {/* Languages */}
//             <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
//               <LanguageSection clerkId={profileUser.clerk_id} isOwner={isOwner} />
//             </div>

//             {/* Profile Checklist */}
//             <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
//               <ProfileChecklist user={profileUser} isOwner={isOwner} onUpdatePlan={() => getUser(username).then(setProfileUser)} />
//             </div>
//           </div>

//           {/* Right Column - Activity */}
//           <div className="flex-1">
//             <div className="rounded-lg border bg-white p-6 shadow-sm">
//               <h2 className="mb-6 text-xl font-bold">Recent Activity</h2>
//               {profileUser.recentActivity?.length > 0 ? (
//                 <div className="space-y-6">
//                   {profileUser.recentActivity.map((activity: any) => (
//                     <div key={activity.id} className="border-b pb-6 last:border-b-0 last:pb-0">
//                       <div className="mb-2 flex items-center justify-between">
//                         <span className="font-medium">{activity.type}</span>
//                         <span className="text-sm text-gray-500">{activity.date}</span>
//                       </div>
//                       <p className="text-gray-700">{activity.description}</p>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-gray-500">No recent activity</p>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </main>
//   );
// }

"use client";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Star, MapPin, Flag, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import ProfileHeader from "@/components/profile/ProfileHeader";
import AboutSection from "@/components/profile/AboutSection";
import LanguageSection from "@/components/profile/LanguageSection";
import ProfileChecklist from "@/components/profile/ProfileChecklist";

// Định nghĩa type cho các trường JSON trong user
type PlanToUse = {
  primary?: boolean;
  secondary?: boolean;
  non_business?: boolean;
};

type UserProfile = {
  clerk_id: string;
  username: string;
  plan_to_use?: PlanToUse;
  languages?: string[] | Record<string, any>;
  user_roles?: string[];
  checklist_status?: Record<string, any>;
  recentActivity?: { id: string; type: string; date: string; description: string }[];
  [key: string]: any;
};

// Hàm chuẩn hóa dữ liệu từ API
function normalizeUserData(user: any): UserProfile {
  return {
    ...user,
    plan_to_use: user?.plan_to_use || { primary: false, secondary: false, non_business: false },
    languages: Array.isArray(user?.languages) ? user.languages : [],
    user_roles: Array.isArray(user?.user_roles) ? user.user_roles : [],
    checklist_status: user?.checklist_status || {},
    recentActivity: Array.isArray(user?.recentActivity) ? user.recentActivity : [],
  };
}

async function getUser(username: string): Promise<UserProfile | null> {
  try {
    const userRes = await fetch(`http://localhost:8800/api/users/username/${username}`);
    if (!userRes.ok) return null;
    const userData = await userRes.json();
    return normalizeUserData(userData);
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export default function BuyerProfilePage() {
  const { user } = useUser();
  const params = useParams();
  const username = params.username as string;
  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const userData = await getUser(username);
        setProfileUser(userData);
      } catch (err: any) {
        setError('Failed to load user profile');
        console.error('Error in fetchUser:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [username]);

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

  if (error || !profileUser) {
    return (
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container px-4 flex flex-col items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
            <p className="text-gray-600">
              {error || "The user you're looking for doesn't exist or has been removed."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const handleUpdatePlan = async () => {
    const updatedUser = await getUser(username);
    setProfileUser(updatedUser);
  };

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
              <AboutSection
                profile={profileUser}
                isOwner={isOwner}
                onUpdated={() => getUser(username).then(setProfileUser)}
              />
            </div>
            {/* Languages */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <LanguageSection clerkId={profileUser.clerk_id} isOwner={isOwner} />
            </div>

            {/* Profile Checklist */}
            <div className="mb-6 rounded-lg border bg-white p-6 shadow-sm">
              <ProfileChecklist
                user={profileUser}
                isOwner={isOwner}
                onUpdatePlan={handleUpdatePlan}
              />
            </div>
          </div>

          {/* Right Column - Activity */}
          {/* <div className="flex-1">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-bold">Recent Activity</h2>
              {profileUser.recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {profileUser.recentActivity.map((activity: any) => (
                    <div key={activity.id} className="border-b pb-6 last:border-b-0 last:pb-0">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">{activity.type}</span>
                        <span className="text-sm text-gray-500">{activity.date}</span>
                      </div>
                      <p className="text-gray-700">{activity.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No recent activity</p>
              )}
            </div>
          </div> */}
        </div>
      </div>
    </main>
  );
}