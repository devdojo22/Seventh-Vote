import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Field } from '@/components/ui/Field';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { describedBy } from '@/lib/aria';
import {
  AuthHeading,
  AuthNotice,
  PasswordInput,
  PRIMARY_LINK_CLASS,
  Spinner,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from './AuthControls';
import { resetPassword } from './auth-api';
import { describeResetPasswordError, RESET_LINK_INVALID_NOTICE } from './auth-errors';
import { resetPasswordSchema, type ResetPasswordValues } from './auth-schema';
import { readLinkToken } from './link-token';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import type { PasswordResetState } from './return-to';

export function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  // Read once and kept in memory only; never written to storage.
  const [token] = useState(() => readLinkToken(location.hash));
  const [linkInvalid, setLinkInvalid] = useState(token === null);
  const [notice, setNotice] = useState<AuthNoticeContent | null>(null);
  const inFlight = useRef(false);

  // Drop the token from the address bar and history as soon as it has been read.
  useEffect(() => {
    if (location.hash) void navigate(location.pathname, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const password = useWatch({ control, name: 'password' });

  const onValid = async (values: ResetPasswordValues) => {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    setNotice(null);
    try {
      await resetPassword({ token, ...values });
      const state: PasswordResetState = { passwordReset: true };
      void navigate('/login', { replace: true, state });
    } catch (error) {
      const view = describeResetPasswordError(error);
      if (view.kind === 'invalid-link') setLinkInvalid(true);
      else if (view.passwordError)
        setError('password', { type: 'server', message: view.passwordError });
      else setNotice(view.notice);
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <section>
      <AuthHeading
        eyebrow="Account recovery"
        title="Choose a new password"
        description="Your new password replaces the old one, and you’ll be signed out on every device. You’ll sign in again with your email code."
      />

      <Card className="sm:p-7">
        {linkInvalid ? (
          <div className="grid gap-4">
            <AuthNotice notice={RESET_LINK_INVALID_NOTICE} />
            <Link to="/forgot-password" replace className={PRIMARY_LINK_CLASS}>
              Request a new link
            </Link>
          </div>
        ) : (
          <form
            noValidate
            className="grid gap-5"
            aria-busy={isSubmitting}
            onSubmit={(e) => void handleSubmit(onValid)(e)}
          >
            <Field id="reset-password" label="New password" error={errors.password?.message}>
              <PasswordInput
                id="reset-password"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={describedBy(
                  'reset-password-strength',
                  errors.password && 'reset-password-error',
                )}
                {...register('password')}
              />
              <PasswordStrengthMeter id="reset-password-strength" password={password} />
            </Field>

            <Field
              id="reset-confirm"
              label="Confirm new password"
              error={errors.confirmPassword?.message}
            >
              <PasswordInput
                id="reset-confirm"
                autoComplete="new-password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'reset-confirm-error' : undefined}
                {...register('confirmPassword')}
              />
            </Field>

            <Button type="submit" fullWidth disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting && <Spinner />}
              {isSubmitting ? 'Saving…' : 'Reset password'}
            </Button>

            <AuthNotice notice={notice} />
          </form>
        )}
      </Card>

      <p className="mt-6 text-center text-sm">
        <Link to="/login" className={`inline-flex items-center gap-1.5 ${TEXT_LINK_CLASS}`}>
          <ArrowLeftIcon className="size-4" />
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
