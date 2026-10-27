import { useCurrentUser } from '@/stores/auth-session-store';
import { ProfileSection } from './ProfileSection';

function ReadOnlyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-paper px-3.5 py-3">
      <dt className="text-xs font-semibold text-navy">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink">{value}</dd>
    </div>
  );
}

export function PersonalInfoCard() {
  const user = useCurrentUser();

  return (
    <ProfileSection
      id="profile-personal"
      title="Personal information"
      description="Your name and the email address you sign in with."
    >
      <dl className="grid gap-3 sm:grid-cols-2">
        {user.firstName || user.lastName ? (
          <>
            <ReadOnlyValue label="First name" value={user.firstName ?? 'Not provided'} />
            <ReadOnlyValue label="Last name" value={user.lastName ?? 'Not provided'} />
          </>
        ) : (
          <ReadOnlyValue label="Full name" value={user.name?.trim() || 'Not provided'} />
        )}
        <ReadOnlyValue label="Email address" value={user.email} />
      </dl>
      <p className="mt-4 border-t border-line2 pt-4 text-xs leading-relaxed text-muted">
        These details come from your Seventh Vote account. Ask an administrator to change them.
      </p>
    </ProfileSection>
  );
}
