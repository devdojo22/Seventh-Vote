import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { CheckCircleIcon, LockIcon, ShieldIcon, SourceDocIcon } from '@/components/ui/icons';
import { formatDate } from '@/features/access/access-labels';
import { describedBy } from '@/lib/aria';
import {
  AuthNotice,
  PasswordInput,
  Spinner,
  type AuthNoticeContent,
} from '@/features/auth/AuthControls';
import { describeChangePasswordError } from '@/features/auth/auth-errors';
import { PASSWORD_MIN_LENGTH } from '@/features/auth/auth-schema';
import { changeOwnPassword } from '@/features/auth/auth-session';
import { PasswordStrengthMeter } from '@/features/auth/PasswordStrengthMeter';
import { useCurrentUser } from '@/stores/auth-session-store';
import { changePasswordSchema, type ChangePasswordValues } from './profile-schema';
import { ProfileSection } from './ProfileSection';

const PASSWORD_CHANGED: AuthNoticeContent = {
  title: 'Password changed',
  body: 'You stay signed in here. Other devices have been signed out and must sign in with the new password.',
};

const SECURITY_FEATURES = [
  {
    Icon: LockIcon,
    title: 'Multi-factor sign-in',
    body: 'A one-time code sent to your email is required after your password.',
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

export function AccountSecurityCard() {
  const user = useCurrentUser();
  const [passwordNotice, setPasswordNotice] = useState<AuthNoticeContent | null>(null);
  const inFlight = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });
  const newPassword = useWatch({ control, name: 'newPassword' });

  const onValid = async (values: ChangePasswordValues) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPasswordNotice(null);
    try {
      // The server signs out every session and returns a new one for this tab. Nothing to show if this tab
      // was signed out (or signed in as someone else) meanwhile: the route guard has already moved on.
      if (!(await changeOwnPassword(values))) return;
      reset();
      setPasswordNotice(PASSWORD_CHANGED);
    } catch (error) {
      const view = describeChangePasswordError(error);
      for (const field of ['currentPassword', 'newPassword', 'confirmPassword'] as const) {
        const message = view.fieldErrors[field];
        if (message) setError(field, { type: 'server', message });
      }
      setPasswordNotice(view.notice);
    } finally {
      inFlight.current = false;
    }
  };

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
              <h3 className="text-sm font-semibold text-navy">Multi-factor authentication</h3>
              <Badge className="bg-pine-bg text-pine">
                <CheckCircleIcon className="size-3.5" />
                Always on
              </Badge>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              Every sign-in asks for an 8-digit code sent to{' '}
              <strong className="font-semibold break-all text-navy">{user.email}</strong> after your
              password.
              {user.emailVerifiedAt &&
                ` Email verified ${formatDate(user.emailVerifiedAt.slice(0, 10))}.`}
            </p>
          </div>
        </div>

        <form
          noValidate
          className="grid gap-5"
          aria-labelledby="profile-password-title"
          aria-busy={isSubmitting}
          onSubmit={(e) => void handleSubmit(onValid)(e)}
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

          <div className="flex justify-end border-t border-line2 pt-4">
            <Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? 'Updating…' : 'Update password'}
            </Button>
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
