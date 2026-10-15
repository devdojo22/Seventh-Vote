import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FieldError, LABEL_CLASS } from '@/components/ui/Field';
import { ArrowLeftIcon, ShieldIcon } from '@/components/ui/icons';
import {
  AuthHeading,
  AuthNotice,
  Spinner,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from './AuthControls';
import { MFA_CODE_LENGTH, mfaCodeError } from './auth-schema';
import { CodeInput } from './CodeInput';

const RESEND_COOLDOWN_SECONDS = 30;

const VERIFY_PENDING: AuthNoticeContent = {
  title: 'Verification isn’t connected yet',
  body: 'Your code is correctly formatted, but MFA checks are still being built for Milestone 2. The code was not checked, sent or stored, and you have not been signed in.',
};

const RESEND_PENDING: AuthNoticeContent = {
  title: 'No code was sent',
  body: 'Verification isn’t connected yet. Once it is, your code will come from your authenticator app, which shows a new one every 30 seconds.',
};

const REJECTED_INPUT = 'Codes contain numbers only. Letters and symbols aren’t allowed.';

const emptyCode = () => Array.from({ length: MFA_CODE_LENGTH }, () => '');

function verifyMfaCode(): Promise<AuthNoticeContent> {
  return Promise.resolve(VERIFY_PENDING);
}

function formatCooldown(seconds: number) {
  return `0:${String(seconds).padStart(2, '0')}`;
}

export function MfaPage() {
  const [digits, setDigits] = useState(emptyCode);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<AuthNoticeContent | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const changeDigits = (next: string[]) => {
    setDigits(next);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const codeError = mfaCodeError(digits.join(''));
    if (codeError) {
      setError(codeError);
      setNotice(null);
      const firstEmpty = digits.findIndex((d) => !d);
      document.getElementById(firstEmpty > 0 ? `mfa-code-${firstEmpty + 1}` : 'mfa-code')?.focus();
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      setNotice(await verifyMfaCode());
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setNotice(RESEND_PENDING);
  };

  return (
    <section>
      <AuthHeading
        eyebrow="Two-step verification"
        title="Verify your identity"
        description="Your password was only the first step. Enter the 6-digit code from your authenticator app to finish signing in."
      />

      <Card className="sm:p-7">
        <div className="mb-6 flex gap-3 rounded-xl border border-line2 bg-paper/70 p-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-navy text-gold shadow-card">
            <ShieldIcon className="size-[18px]" />
          </span>
          <p className="text-[13px] leading-relaxed text-muted">
            <strong className="block font-semibold text-navy">
              Multi-factor authentication is on
            </strong>
            It adds a second layer of protection: even with your password, no one can sign in
            without the device that holds your authenticator.
          </p>
        </div>

        <form noValidate className="grid gap-5" onSubmit={(e) => void handleSubmit(e)}>
          <div className="flex min-w-0 flex-col gap-2">
            <label id="mfa-code-label" htmlFor="mfa-code" className={LABEL_CLASS}>
              Verification code
            </label>
            <CodeInput
              id="mfa-code"
              digits={digits}
              onChange={changeDigits}
              onRejectedInput={() => setError(REJECTED_INPUT)}
              labelledBy="mfa-code-label"
              describedBy={error ? 'mfa-code-hint mfa-code-error' : 'mfa-code-hint'}
              invalid={Boolean(error)}
              disabled={verifying}
            />
            <p id="mfa-code-hint" className="text-xs leading-relaxed text-muted">
              You can paste the whole code into any box.
            </p>
            {error && <FieldError id="mfa-code-error" message={error} />}
          </div>

          <Button type="submit" fullWidth disabled={verifying} aria-busy={verifying}>
            {verifying && <Spinner />}
            {verifying ? 'Verifying…' : 'Verify code'}
          </Button>

          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm text-muted">
            <span>Didn’t get a code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0}
              className={`${TEXT_LINK_CLASS} disabled:cursor-not-allowed disabled:text-muted disabled:no-underline`}
            >
              {cooldown > 0 ? `Resend code in ${formatCooldown(cooldown)}` : 'Resend code'}
            </button>
          </div>

          <AuthNotice notice={notice} />
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
