import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { AppLoader } from '@/components/AppLoader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field, FieldError } from '@/components/ui/Field';
import { IconInput } from '@/components/ui/IconInput';
import { ArrowLeftIcon, MailIcon, UserIcon } from '@/components/ui/icons';
import { ROLE_LABELS } from '@/features/access/access-labels';
import { describedBy } from '@/lib/aria';
import { PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '@/lib/legal-documents';
import { useInvitationStore } from '@/stores/invitation-store';
import {
  AuthHeading,
  AuthNotice,
  PasswordInput,
  PRIMARY_LINK_CLASS,
  Spinner,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from './AuthControls';
import {
  acceptInvitation,
  inspectInvitation,
  joinInvitation,
  type InvitationPreview,
} from './auth-api';
import { describeInvitationError, INVITATION_INVALID_NOTICE } from './auth-errors';
import { acceptInvitationSchema, type AcceptInvitationValues } from './auth-schema';
import { isSessionRejected, reloadCurrentUser, withAccessToken } from './auth-session';
import { readLinkToken } from './link-token';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';
import type { InvitationAcceptedState, ReturnToState } from './return-to';

const INVITE_PATH = '/invite';

function LegalDocumentLink({ href, children }: { href: string | null; children: ReactNode }) {
  if (href === null) return <strong className="font-semibold text-navy">{children}</strong>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={TEXT_LINK_CLASS}>
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

type Phase =
  | { name: 'loading' }
  | { name: 'invalid'; notice: AuthNoticeContent }
  | { name: 'ready'; preview: InvitationPreview };

function NewAccountForm({ token, preview }: { token: string; preview: InvitationPreview }) {
  const navigate = useNavigate();
  const clearToken = useInvitationStore((s) => s.clearToken);
  const [notice, setNotice] = useState<AuthNoticeContent | null>(null);
  const inFlight = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInvitationValues>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
      acceptTerms: false,
    },
  });
  const password = useWatch({ control, name: 'password' });

  const onValid = async (values: AcceptInvitationValues) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setNotice(null);
    try {
      await acceptInvitation({
        token,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
        confirmPassword: values.confirmPassword,
      });
      clearToken();
      const state: InvitationAcceptedState = { invitationAccepted: true };
      void navigate('/login', { replace: true, state });
    } catch (error) {
      const view = describeInvitationError(error);
      for (const [field, message] of Object.entries(view.fieldErrors)) {
        setError(field as keyof typeof view.fieldErrors, { type: 'server', message });
      }
      setNotice(view.notice);
    } finally {
      inFlight.current = false;
    }
  };

  return (
    <form
      noValidate
      className="grid gap-5"
      aria-busy={isSubmitting}
      onSubmit={(e) => void handleSubmit(onValid)(e)}
    >
      <Field id="invite-email" label="Email address" hint="Invitations are tied to this address.">
        <IconInput
          id="invite-email"
          icon={MailIcon}
          type="email"
          value={preview.email}
          readOnly
          aria-describedby="invite-email-hint"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2 sm:gap-4">
        <Field id="invite-first-name" label="First name" error={errors.firstName?.message}>
          <IconInput
            id="invite-first-name"
            icon={UserIcon}
            autoComplete="given-name"
            aria-invalid={Boolean(errors.firstName)}
            aria-describedby={errors.firstName ? 'invite-first-name-error' : undefined}
            {...register('firstName')}
          />
        </Field>

        <Field id="invite-last-name" label="Last name" error={errors.lastName?.message}>
          <IconInput
            id="invite-last-name"
            icon={UserIcon}
            autoComplete="family-name"
            aria-invalid={Boolean(errors.lastName)}
            aria-describedby={errors.lastName ? 'invite-last-name-error' : undefined}
            {...register('lastName')}
          />
        </Field>
      </div>

      <Field id="invite-password" label="Password" error={errors.password?.message}>
        <PasswordInput
          id="invite-password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={describedBy(
            'invite-password-strength',
            errors.password && 'invite-password-error',
          )}
          {...register('password')}
        />
        <PasswordStrengthMeter id="invite-password-strength" password={password} />
      </Field>

      <Field id="invite-confirm" label="Confirm password" error={errors.confirmPassword?.message}>
        <PasswordInput
          id="invite-confirm"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? 'invite-confirm-error' : undefined}
          {...register('confirmPassword')}
        />
      </Field>

      <div className="grid gap-1.5">
        <Checkbox
          aria-invalid={Boolean(errors.acceptTerms)}
          aria-describedby={errors.acceptTerms ? 'invite-terms-error' : undefined}
          label={
            <>
              I agree to the{' '}
              <LegalDocumentLink href={TERMS_OF_SERVICE_URL}>Terms of Service</LegalDocumentLink>{' '}
              and <LegalDocumentLink href={PRIVACY_POLICY_URL}>Privacy Policy</LegalDocumentLink>.
            </>
          }
          {...register('acceptTerms')}
        />
        {errors.acceptTerms?.message && (
          <FieldError id="invite-terms-error" message={errors.acceptTerms.message} />
        )}
      </div>

      <Button type="submit" fullWidth disabled={isSubmitting} aria-busy={isSubmitting}>
        {isSubmitting && <Spinner />}
        {isSubmitting ? 'Creating account…' : 'Create account and join'}
      </Button>

      <AuthNotice notice={notice} />
    </form>
  );
}

function JoinExistingAccount({ token, preview }: { token: string; preview: InvitationPreview }) {
  const navigate = useNavigate();
  const clearToken = useInvitationStore((s) => s.clearToken);
  const [notice, setNotice] = useState<AuthNoticeContent | null>(null);
  const [joining, setJoining] = useState(false);

  const join = async () => {
    setJoining(true);
    setNotice(null);
    try {
      await withAccessToken((accessToken) => joinInvitation(accessToken, token));
      clearToken();
      await reloadCurrentUser();
      void navigate('/', { replace: true });
    } catch (error) {
      if (isSessionRejected(error)) {
        const state: ReturnToState = { from: INVITE_PATH };
        void navigate('/login', { state });
        return;
      }
      setNotice(describeInvitationError(error).notice);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="grid gap-4">
      <p className="text-sm leading-relaxed text-muted">
        <strong className="font-semibold text-navy">{preview.email}</strong> already has a Seventh
        Vote account. Accept to add this workspace to it. If you aren’t signed in, you’ll sign in
        first with your password and an emailed code.
      </p>
      <Button fullWidth onClick={() => void join()} disabled={joining} aria-busy={joining}>
        {joining && <Spinner />}
        {joining ? 'Accepting…' : 'Accept invitation'}
      </Button>
      <AuthNotice notice={notice} />
    </div>
  );
}

export function AcceptInvitationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const storedToken = useInvitationStore((s) => s.token);
  const setToken = useInvitationStore((s) => s.setToken);
  // Read once and kept in memory only; never written to storage.
  const [token] = useState(() => readLinkToken(location.hash) ?? storedToken);
  const [phase, setPhase] = useState<Phase>(() =>
    token === null ? { name: 'invalid', notice: INVITATION_INVALID_NOTICE } : { name: 'loading' },
  );

  useEffect(() => {
    if (location.hash) void navigate(location.pathname, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  useEffect(() => {
    if (token === null) return;
    setToken(token);
    let active = true;
    inspectInvitation(token)
      .then((preview) => {
        if (active) setPhase({ name: 'ready', preview });
      })
      .catch((error: unknown) => {
        if (!active) return;
        const view = describeInvitationError(error);
        setPhase({ name: 'invalid', notice: view.notice ?? INVITATION_INVALID_NOTICE });
      });
    return () => {
      active = false;
    };
  }, [token, setToken]);

  if (phase.name === 'loading') return <AppLoader label="Checking your invitation…" />;

  return (
    <section>
      <AuthHeading
        eyebrow="Workspace invitation"
        title={
          phase.name === 'ready' ? `Join ${phase.preview.workspaceName}` : 'Accept your invitation'
        }
        description={
          phase.name === 'ready'
            ? `You’ve been invited as ${phase.preview.role === 'PRINCIPAL' ? 'the' : 'an'} ${ROLE_LABELS[phase.preview.role]}. Every sign-in also needs a code we email to you.`
            : 'Seventh Vote workspaces are joined by invitation only.'
        }
      />

      <Card className="sm:p-7">
        {phase.name === 'invalid' || token === null ? (
          <div className="grid gap-4">
            <AuthNotice
              notice={phase.name === 'invalid' ? phase.notice : INVITATION_INVALID_NOTICE}
            />
            <Link to="/login" replace className={PRIMARY_LINK_CLASS}>
              Go to sign in
            </Link>
          </div>
        ) : phase.preview.accountExists ? (
          <JoinExistingAccount token={token} preview={phase.preview} />
        ) : (
          <NewAccountForm token={token} preview={phase.preview} />
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
