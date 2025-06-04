import EducationSection from './EducationSection';
import CertificationSection from './CertificationSection';
import SkillsSection from './SkillsSection';
import ProfileChecklist from './ProfileChecklist';
import QuickLinks from './QuickLinks';
import { PortfolioSection } from '../portfolio-section';

export default function ProfileMain({ profile, isOwner }: { profile: any, isOwner: boolean }) {
  const isSeller = profile.user_roles?.includes('employer');
  const isBuyer = profile.user_roles?.includes('seeker');

  return (
    <main className="flex-1 space-y-8">
      {isSeller && (
        <>
          <QuickLinks clerkId={profile.clerk_id} />
          <PortfolioSection clerkId={profile.clerk_id} />
        </>
      )}
      {isBuyer && <ProfileChecklist checklist={profile.checklist_status} />}
      <EducationSection clerkId={profile.clerk_id} />
      <CertificationSection clerkId={profile.clerk_id} />
      <SkillsSection clerkId={profile.clerk_id} />
    </main>
  );
}
