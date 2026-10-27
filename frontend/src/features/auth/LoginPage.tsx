import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field, FieldError, LABEL_CLASS } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { MailIcon } from '@/components/ui/icons';
import { useAuthSessionStore } from '@/stores/auth-session-store';
import { useVerificationChallengeStore } from '@/stores/verification-challenge-store';
import {
  AuthHeading,
  AuthNotice,
  PasswordInput,
  Spinner,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from './AuthControls';
import { loginAccount } from './auth-api';
import { describeLoginError } from './auth-errors';
import { loginSchema, type LoginValues } from './auth-schema';
import {
  isInvitationAcceptedState,
  isPasswordResetState,
  readReturnTo,
  type ReturnToState,
} from './return-to';

const PASSWORD_RESET_NOTICE: AuthNoticeContent = {
  title: 'Your password was reset',
  body: 'Sign in with your new password. We’ll email you a verification code as usual.',
};

const INVITATION_ACCEPTED_NOTICE: AuthNoticeContent = {
  title: 'Your account is ready',
  body: 'Sign in with your email and new password. We’ll email you a verification code.',
};

const SESSION_EXPIRED_NOTICE: AuthNoticeContent = {
  title: 'Your session ended',
  body: 'You were signed out because your session expired or your access changed. Sign in again to continue.',
};

function initialNotice(state: unknown, sessionExpired: boolean): AuthNoticeContent | null {
  if (isPasswordResetState(state)) return PASSWORD_RESET_NOTICE;
  if (isInvitationAcceptedState(state)) return INVITATION_ACCEPTED_NOTICE;
  return sessionExpired ? SESSION_EXPIRED_NOTICE : null;
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = useAuthSessionStore((s) => s.sessionExpired);
  const [notice, setNotice] = useState<AuthNoticeContent | null>(() =>
    initialNotice(location.state, sessionExpired),
  );
  const inFlight = useRef(false);
  const setChallenge = useVerificationChallengeStore((s) => s.setChallenge);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', remember: false },
  });

  const onValid = async (values: LoginValues) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setNotice(null);
    try {
      const email = values.email.toLowerCase();
      const { mfaToken, resendAfterSeconds } = await loginAccount({
        email,
        password: values.password,
        remember: values.remember,
      });
      setChallenge({ mfaToken, email, resendAfterSeconds });
      const state: ReturnToState = { from: readReturnTo(location.state) };
      void navigate('/verify', { replace: true, state });
    } catch (error) {
      setNotice(describeLoginError(error));
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <section>
      <AuthHeading
        eyebrow="Secure sign-in"
        title="Welcome back"
        description="Sign in to your Seventh Vote workspace to rehearse council sessions and prepare your outreach."
      />

      <Card className="sm:p-7">
        <form
          noValidate
          className="grid gap-5"
          aria-busy={isSubmitting}
          onSubmit={(e) => void handleSubmit(onValid)(e)}
        >
          <Field id="login-email" label="Email address" error={errors.email?.message}>
            <IconInput
              id="login-email"
              icon={MailIcon}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.gov"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'login-email-error' : undefined}
              {...register('email')}
            />
          </Field>

          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="login-password" className={LABEL_CLASS}>
                Password
              </label>
              <Link to="/forgot-password" className={`text-xs ${TEXT_LINK_CLASS}`}>
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'login-password-error' : undefined}
              {...register('password')}
            />
            {errors.password?.message && (
              <FieldError id="login-password-error" message={errors.password.message} />
            )}
          </div>

          <Checkbox label="Keep me signed in on this device" {...register('remember')} />

          <Button
            type="submit"
            fullWidth
            className="mt-1"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting && <Spinner />}
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>

          <AuthNotice notice={notice} />
        </form>
      </Card>

      <p className="mt-6 text-center text-sm leading-relaxed text-muted">
        New to Seventh Vote? Access is by invitation only. Ask your workspace’s Principal to invite
        you, then follow the link in the invitation email.
      </p>
    </section>
  );
}
