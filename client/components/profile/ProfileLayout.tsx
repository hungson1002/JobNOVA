import ProfileSidebar from './ProfileSidebar';
import ProfileMain from './ProfileMain';

export default function ProfileLayout({ profile, isOwner }: { profile: any, isOwner: boolean }) {
  return (
    <div className="flex gap-8">
      <ProfileSidebar profile={profile} isOwner={isOwner} />
      <ProfileMain profile={profile} isOwner={isOwner} />
    </div>
  );
}
