import { PageHeader } from '@/components/PageHeader';
import { useCurrentUser } from '@/stores/auth-session-store';
import { AccountSecurityCard } from './AccountSecurityCard';
import { PersonalInfoCard } from './PersonalInfoCard';
import { ProfileOverview } from './ProfileOverview';
import { WorkspaceAccessCard } from './WorkspaceAccessCard';

export function ProfilePage() {
  const user = useCurrentUser();

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Your account details, security, and workspace access."
      />

      <ProfileOverview user={user} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:items-start">
        <div className="grid min-w-0 grid-cols-1 gap-6">
          <PersonalInfoCard />
          <AccountSecurityCard />
        </div>
        <WorkspaceAccessCard />
      </div>
    </section>
  );
}
