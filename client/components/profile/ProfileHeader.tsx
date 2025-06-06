import Image from 'next/image';
import { Star, MapPin, Flag, MessageSquare, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SidebarEdit from './SidebarEdit';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';

interface ProfileHeaderProps {
  profile: any;
  isOwner: boolean;
}

const roleBadgeColor = (role: string) => {
  if (role === 'employer' || role === 'seller') return 'bg-red-100 text-red-700 border border-red-300';
  if (role === 'seeker' || role === 'buyer') return 'bg-blue-100 text-blue-700 border border-blue-300';
  return 'bg-gray-100 text-gray-700 border border-gray-300';
};

export default function ProfileHeader({ profile, isOwner }: ProfileHeaderProps) {
  // Xác định role buyer
  const isBuyer = Array.isArray(profile.user_roles)
    ? profile.user_roles.includes('buyer') || profile.user_roles.includes('seeker')
    : false;

  // Xử lý các trường preferred_days, preferred_hours, plan_to_use
  const preferredDays = profile.preferred_days || 'preferred working days';
  const preferredHours = profile.preferred_hours || 'preferred working hours';
  // Render plan_to_use as a string for display
  let planToUse = "doesn't set plan";
  if (profile.plan_to_use && typeof profile.plan_to_use === 'object' && Object.values(profile.plan_to_use).some(Boolean)) {
    const planMap: Record<string, string> = {
      primary: 'Primary job/business',
      secondary: 'Secondary business',
      non_business: 'Non-business needs',
    };
    planToUse = Object.entries(profile.plan_to_use)
      .filter(([_, v]) => v)
      .map(([k]) => planMap[k] || k)
      .join(', ');
  }

  const roles = Array.isArray(profile.user_roles)
    ? profile.user_roles
    : profile.user_roles
      ? [profile.user_roles]
      : [];

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { getToken } = useAuth();
  const [localProfile, setLocalProfile] = useState({
    firstname: profile.firstname || '',
    lastname: profile.lastname || '',
  });

  // Update localProfile if profile changes
  // (prevents stale state if user switches profile)
  useEffect(() => {
    setLocalProfile({
      firstname: profile.firstname || '',
      lastname: profile.lastname || '',
    });
  }, [profile.firstname, profile.lastname]);

  const handleEditName = () => setSidebarOpen(true);

  const handleSaveName = async (form: any) => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication error: Unable to get token');
      // Allow either field to be empty
      const firstname = form.firstname?.trim() || '';
      const lastname = form.lastname?.trim() || '';
      const fullName = [firstname, lastname].filter(Boolean).join(' ');
      // Only send fields that are present
      const body: any = {};
      if (firstname) body.firstname = firstname;
      if (lastname) body.lastname = lastname;
      body.name = fullName;
      const response = await fetch(`http://localhost:8800/api/users/${profile.clerk_id}/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update name');
      }
      setLocalProfile({ firstname, lastname });
      // Update the profile object in-place so UI updates immediately
      if (profile) {
        profile.firstname = firstname;
        profile.lastname = lastname;
        profile.name = fullName;
      }
      toast.success('Name updated successfully');
      setSidebarOpen(false);
    } catch (error) {
      toast.error((error as Error).message || 'An error occurred while updating name');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full rounded-lg border bg-white p-6 shadow-sm flex flex-col gap-6 md:flex-row items-center justify-between">
      <div className="flex items-center gap-6 w-full">
        <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-white shadow-md">
          <Image src={profile.avatar || "/placeholder.svg"} alt={profile.firstname + ' ' + profile.lastname || 'User'} fill className="object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold truncate mb-0">
              {(!profile.firstname && !profile.lastname)
                ? 'No Name'
                : [profile.firstname, profile.lastname].filter(Boolean).join(' ')}
            </h1>
            {isOwner && (
              <button className="ml-1 p-1 rounded-full hover:bg-gray-100" onClick={handleEditName} title="Edit name">
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-lg text-gray-600 truncate mb-0">@{profile.username || 'No Username'}</p>
            {/* Role badges ngang hàng username */}
            {roles.length > 0 && (
              <div className="flex flex-row gap-2 ml-2">
                {roles.map((role: string) => (
                  <span
                    key={role}
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${roleBadgeColor(role)}`}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {profile.rating && (
              <div className="flex items-center">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="ml-1 font-medium">{profile.rating}</span>
                <span className="ml-1 text-gray-600">({profile.reviewCount || 0})</span>
              </div>
            )}
            {profile.location && (
              <div className="flex items-center text-gray-600">
                <MapPin className="mr-1 h-4 w-4" />
                {profile.location}
              </div>
            )}
            {/* Country */}
            {profile.country && (
              <div className="text-gray-600">Country: {profile.country}</div>
            )}
            {/* Joined at */}
            {(profile.joined_at || profile.registration_date) && (
              <div className="text-gray-600">
                Joined: {profile.joined_at || profile.registration_date}
              </div>
            )}
            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="text-gray-600">
                Languages: {profile.languages.map((l: any) => l.language ? `${l.language} (${l.level})` : `${l.name} (${l.level})`).join(', ')}
              </div>
            )}
          </div>
          {/* Nếu là buyer, hiển thị thêm các trường preferred_days, preferred_hours, plan_to_use */}
          {isBuyer && (
            <div className="mt-2 space-y-1">
              <div className="text-gray-600">Preferred Days: {preferredDays}</div>
              <div className="text-gray-600">Preferred Hours: {preferredHours}</div>
              <div className="text-gray-600">Plan to Use: {planToUse}</div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2 md:ml-auto md:mt-0 min-w-fit">
        {isOwner ? (
            <Button
            className="bg-emerald-500 hover:bg-emerald-600"
            onClick={() => window.location.href = '/profile/settings'}
            >
            Setting Account
            </Button>
        ) : (
          <>
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Me
            </Button>
            <Button variant="outline">
              <Flag className="mr-2 h-4 w-4" />
              Report User
            </Button>
          </>
        )}
      </div>
      <SidebarEdit
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Edit Name"
        fields={[
          { name: 'firstname', label: 'First Name', value: localProfile.firstname },
          { name: 'lastname', label: 'Last Name', value: localProfile.lastname },
        ]}
        onSaved={handleSaveName}
      />
    </div>
  );
}
