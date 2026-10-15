import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Callout } from '@/components/ui/Callout';
import { Card } from '@/components/ui/Card';
import { Field, LABEL_CLASS } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { ArrowLeftIcon, MailIcon } from '@/components/ui/icons';
import {
  AuthHeading,
  AuthNotice,
  Spinner,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from './AuthControls';
import { forgotPasswordSchema, type ForgotPasswordValues } from './auth-schema';

const CONFIRMATION_TITLE_ID = 'forgot-password-confirmation';

const REQUEST_FAILED: AuthNoticeContent = {
  title: 'We couldn’t take your request',
  body: 'Something went wrong. Check your connection and try again.',
};

function requestPasswordReset(): Promise<void> {
  return Promise.resolve();
}

type View = 'form' | 'confirmation';

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>('form');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [submitError, setSubmitError] = useState<AuthNoticeContent | null>(null);
  const focusAfterSwitch = useRef(false);

  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  useEffect(() => {
    if (!focusAfterSwitch.current) return;
    focusAfterSwitch.current = false;
    if (view === 'confirmation') document.getElementById(CONFIRMATION_TITLE_ID)?.focus();
    else setFocus('email', { shouldSelect: true });
  }, [view, setFocus]);

  const switchView = (next: View) => {
    focusAfterSwitch.current = true;
    setView(next);
  };

  const onSubmit = async ({ email }: ForgotPasswordValues) => {
    setSubmitError(null);
    try {
      await requestPasswordReset();
      setSubmittedEmail(email);
      switchView('confirmation');
    } catch {
      setSubmitError(REQUEST_FAILED);
    }
  };

  if (view === 'confirmation') {
    return (
      <section>
        <AuthHeading
          eyebrow="Account recovery"
          title="Password reset request"
          description="Your request passed validation in the browser. Here is where things stand."
          titleId={CONFIRMATION_TITLE_ID}
        />

        <Card className="grid gap-5 sm:p-7">
          <div className="flex items-center gap-3 rounded-xl border border-line2 bg-paper/70 p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-navy text-gold shadow-card">
              <MailIcon className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <span className={`block ${LABEL_CLASS}`}>Email address</span>
              <span className="block text-sm break-all text-muted">{submittedEmail}</span>
            </div>
          </div>

          <Callout title="No email was sent">
            Password reset isn’t connected yet. It’s being built with sign-in for Milestone 2. Once
            it is, a reset link will be sent to this address if it belongs to a Seventh Vote
            account. Until then, ask your workspace administrator to restore your access.
          </Callout>

          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="secondary" fullWidth onClick={() => switchView('form')}>
              Edit email address
            </Button>
            <Button fullWidth onClick={() => void navigate('/login')}>
              Back to sign in
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section>
      <AuthHeading
        eyebrow="Account recovery"
        title="Forgot your password?"
        description="No worries. Enter the email address associated with your account, and we’ll help you reset your password."
      />

      <Card className="sm:p-7">
        <form noValidate className="grid gap-5" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
          <Field id="forgot-email" label="Email address" error={errors.email?.message}>
            <IconInput
              id="forgot-email"
              icon={MailIcon}
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="name@example.gov"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'forgot-email-error' : undefined}
              {...register('email')}
            />
          </Field>

          <Button type="submit" fullWidth disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting && <Spinner />}
            {isSubmitting ? 'Submitting…' : 'Send reset link'}
          </Button>

          <AuthNotice notice={submitError} />
        </form>
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
