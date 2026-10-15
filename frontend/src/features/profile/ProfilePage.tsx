import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Callout } from '@/components/ui/Callout';
import { useProfileStore } from '@/stores/profile-store';
import { AccountSecurityCard } from './AccountSecurityCard';
import { PersonalInfoCard } from './PersonalInfoCard';
import { ProfileOverview } from './ProfileOverview';
import { WorkspaceAccessCard } from './WorkspaceAccessCard';

export function ProfilePage() {
  const user = useProfileStore((s) => s.user);
  const isDemo = useProfileStore((s) => s.isDemo);
  const [editing, setEditing] = useState(false);

  const startEditing = () => {
    setEditing(true);
    // Let the form mount, then bring it into view and focus the first field.
    requestAnimationFrame(() => {
      const input = document.getElementById('profile-name');
      input?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      input?.focus({ preventScroll: true });
    });
  };

  return (
    <section className="space-y-8">
      <PageHeader
        eyebrow="Account"
        title="My Profile"
        description="Manage your personal information and account preferences."
      />

      {isDemo && (
        <Callout title="Demonstration profile, not connected">
          There is no signed-in session yet, so this page shows a sample account held in this
          browser tab. Edits change nothing on a server, and reloading restores the original. Real
          accounts arrive with Milestone 2.
        </Callout>
      )}

      <ProfileOverview user={user} onEdit={startEditing} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)] lg:items-start">
        <div className="grid gap-6">
          <PersonalInfoCard editing={editing} onEditingChange={setEditing} />
          <AccountSecurityCard />
        </div>
        <WorkspaceAccessCard />
      </div>
    </section>
  );
}
