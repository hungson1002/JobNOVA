interface ProfileSidebarProps {
  profile: any;
  isOwner: boolean;
}

export default function ProfileSidebar({ profile, isOwner }: ProfileSidebarProps) {
  return (
    <aside className="w-80 flex flex-col items-center gap-4 p-4 border rounded-lg bg-white">
      <img src={profile.avatar} alt="avatar" className="w-24 h-24 rounded-full object-cover" />
      <h2 className="text-xl font-bold">{profile.firstname} {profile.lastname}</h2>
      <p className="text-gray-500">{profile.location || profile.country}</p>
      <p className="text-gray-500">Role: {profile.user_roles?.join(', ')}</p>
      <p className="text-gray-500">Languages: {profile.languages?.map((l: any) => `${l.language} (${l.level})`).join(', ')}</p>
      <p className="text-gray-500">Joined: {profile.registration_date}</p>
      {isOwner && (
        <button className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">
          Edit Profile
        </button>
      )}
    </aside>
  );
}
