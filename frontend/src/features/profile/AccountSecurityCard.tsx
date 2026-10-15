import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link } from 'react-router';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import {
  AlertIcon,
  ArrowUpRightIcon,
  CheckCircleIcon,
  LockIcon,
  ShieldIcon,
  SourceDocIcon,
} from '@/components/ui/icons';
import { Switch } from '@/components/ui/Switch';
import {
  AuthNotice,
  PasswordInput,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from '@/features/auth/AuthControls';
import { PASSWORD_MIN_LENGTH } from '@/features/auth/auth-schema';
import { PasswordStrengthMeter } from '@/features/auth/PasswordStrengthMeter';
import { useProfileStore } from '@/stores/profile-store';
import { changePasswordSchema, type ChangePasswordValues } from './profile-schema';
import { ProfileSection } from './ProfileSection';

const PASSWORD_PENDING: AuthNoticeContent = {
  title: 'Password changes aren’t connected yet',
  body: 'Your new password passed validation, but the auth service endpoint is still being built for Milestone 2. Your password was not changed and nothing was sent or stored.',
};

const MFA_PENDING: AuthNoticeContent = {
  title: 'This switch only changes the display',
  body: 'Enrolling or removing an authenticator app arrives with Milestone 2. MFA was not actually enabled or disabled, and nothing was sent or stored.',
};

const SECURITY_FEATURES = [
  {
    Icon: LockIcon,
    title: 'Multi-factor sign-in',
    body: 'A one-time code from your authenticator app is required after your password.',
  },
  {
    Icon: ShieldIcon,
    title: 'Role-scoped access',
    body: 'You open only the council workspaces an administrator has granted you.',
  },
  {
    Icon: SourceDocIcon,
    title: 'Private by design',
    body: 'Your calls on members stay in this browser and are never stored or exported.',
  },
];

function describedBy(...ids: (string | false | undefined)[]) {
  return ids.filter(Boolean).join(' ') || undefined;
}

export function AccountSecurityCard() {
  const user = useProfileStore((s) => s.user);
  // Respect a genuine MFA status when the account has one; otherwise the switch starts off.
  const [mfaEnabled, setMfaEnabled] = useState<boolean>(() => user.mfaEnabled ?? false);
  const [mfaTouched, setMfaTouched] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<AuthNoticeContent | null>(null);

  const toggleMfa = (next: boolean) => {
    setMfaEnabled(next);
    setMfaTouched(true);
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  return (
    <ProfileSection
      id="profile-security"
      title="Account security"
      description="Keep your sign-in protected with a strong password and multi-factor authentication."
    >
      <div className="grid gap-6">
        <div className="flex flex-col gap-4 rounded-xl border border-line2 bg-paper/70 p-4 sm:flex-row sm:items-start">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy text-gold shadow-card">
            <ShieldIcon className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Switch
                id="profile-mfa"
                checked={mfaEnabled}
                onChange={toggleMfa}
                label="Multi-factor authentication"
                describedBy="profile-mfa-status"
              />
              <Badge
                className={
                  mfaEnabled
                    ? 'bg-pine-bg text-pine'
                    : 'border border-gold/35 bg-amber-bg text-amber'
                }
              >
                {mfaEnabled ? (
                  <CheckCircleIcon className="size-3.5" />
                ) : (
                  <AlertIcon className="size-3.5 text-gold" />
                )}
                {mfaEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p
              id="profile-mfa-status"
              aria-live="polite"
              className="mt-2 text-[13px] leading-relaxed text-muted"
            >
              {mfaEnabled
                ? 'Every sign-in asks for a 6-digit code from your authenticator app after your password.'
                : 'Sign-in uses your password only. Turn this on to require an authenticator code as well.'}
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/verify"
                className={`inline-flex items-center gap-1 text-xs ${TEXT_LINK_CLASS}`}
              >
                Open verification screen
                <ArrowUpRightIcon className="size-3.5" />
              </Link>
            </div>
            <div className={mfaTouched ? 'mt-3' : undefined}>
              <AuthNotice notice={mfaTouched ? MFA_PENDING : null} />
            </div>
          </div>
        </div>

        <form
          noValidate
          className="grid gap-5"
          aria-labelledby="profile-password-title"
          onSubmit={(e) => void handleSubmit(() => setPasswordNotice(PASSWORD_PENDING))(e)}
        >
          <div>
            <h3 id="profile-password-title" className="text-sm font-semibold text-navy">
              Change password
            </h3>
            <p className="text-xs leading-relaxed text-muted">
              Use at least {PASSWORD_MIN_LENGTH} characters. Other devices will need to sign in
              again.
            </p>
          </div>

          <Field
            id="profile-current-password"
            label="Current password"
            required
            error={errors.currentPassword?.message}
          >
            <PasswordInput
              id="profile-current-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.currentPassword)}
              aria-describedby={
                errors.currentPassword ? 'profile-current-password-error' : undefined
              }
              {...register('currentPassword')}
            />
          </Field>

          <Field
            id="profile-new-password"
            label="New password"
            required
            error={errors.newPassword?.message}
          >
            <PasswordInput
              id="profile-new-password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              aria-describedby={describedBy(
                'profile-password-strength',
                errors.newPassword && 'profile-new-password-error',
              )}
              {...register('newPassword')}
            />
            <PasswordStrengthMeter id="profile-password-strength" password={newPassword} />
          </Field>

          <Field
            id="profile-confirm-password"
            label="Confirm new password"
            required
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              id="profile-confirm-password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? 'profile-confirm-password-error' : undefined
              }
              {...register('confirmPassword')}
            />
          </Field>

          <div className="flex flex-col gap-3 border-t border-line2 pt-4 sm:flex-row sm:items-center">
            <p className="text-xs text-muted sm:mr-auto">
              Backend integration isn’t available yet: submitting only validates the form.
            </p>
            <Button type="submit">Update password</Button>
          </div>

          <AuthNotice notice={passwordNotice} />
        </form>

        <ul className="grid gap-3 border-t border-line2 pt-5 sm:grid-cols-3">
          {SECURITY_FEATURES.map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-line bg-paper">
                <Icon className="size-4 text-navy" />
              </span>
              <div className="min-w-0">
                <strong className="block text-[13px] font-semibold text-navy">{title}</strong>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">{body}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </ProfileSection>
  );
}
