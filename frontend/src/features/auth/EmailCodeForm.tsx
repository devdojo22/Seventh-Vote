import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { FieldError, LABEL_CLASS } from '@/components/ui/Field';
import { MailIcon } from '@/components/ui/icons';
import {
  useVerificationChallengeStore,
  type VerificationChallenge,
} from '@/stores/verification-challenge-store';
import { AuthNotice, Spinner, type AuthNoticeContent } from './AuthControls';
import { resendVerificationCode } from './auth-api';
import {
  describeCodeError,
  describeResendError,
  INVALID_CODE_MESSAGE,
  type ResendErrorView,
} from './auth-errors';
import { MFA_CODE_LENGTH, mfaCodeError } from './auth-schema';
import { CodeInput } from './CodeInput';

const REJECTED_INPUT = 'Codes contain numbers only. Letters and symbols aren’t allowed.';
const FALLBACK_COOLDOWN_SECONDS = 30;

const NEW_CODE_SENT: AuthNoticeContent = {
  title: 'New code sent',
  body: 'Check your inbox. Earlier codes no longer work.',
};

const emptyCode = () => Array.from({ length: MFA_CODE_LENGTH }, () => '');

function useSecondsUntil(target: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => {
      const current = Date.now();
      setNow(current);
      if (current >= target) window.clearInterval(timer);
    };
    const immediate = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearTimeout(immediate);
      window.clearInterval(timer);
    };
  }, [target]);
  return Math.max(0, Math.ceil((target - now) / 1000));
}

interface EmailCodeFormProps {
  challenge: VerificationChallenge;
  id: string;
  submitLabel: string;
  onVerify: (mfaToken: string, code: string) => Promise<void>;
  onChallengeEnded: (notice: AuthNoticeContent) => void;
}

export function EmailCodeForm({
  challenge,
  id,
  submitLabel,
  onVerify,
  onChallengeEnded,
}: EmailCodeFormProps) {
  const setChallenge = useVerificationChallengeStore((s) => s.setChallenge);
  const delayResend = useVerificationChallengeStore((s) => s.delayResend);

  const [digits, setDigits] = useState(emptyCode);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<AuthNoticeContent | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const inFlight = useRef(false);
  const resendWait = useSecondsUntil(challenge.resendAvailableAt);

  const changeDigits = (next: string[]) => {
    setDigits(next);
    setError(null);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = digits.join('');
    const formatError = mfaCodeError(code);
    if (formatError) {
      setError(formatError);
      setNotice(null);
      const firstEmpty = digits.findIndex((d) => !d);
      document.getElementById(firstEmpty > 0 ? `${id}-${firstEmpty + 1}` : id)?.focus();
      return;
    }

    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setNotice(null);
    setVerifying(true);
    try {
      await onVerify(challenge.mfaToken, code);
    } catch (err) {
      const view = describeCodeError(err);
      switch (view.kind) {
        case 'invalid-code':
          setDigits(emptyCode());
          setError(INVALID_CODE_MESSAGE);
          break;
        case 'code-expired':
        case 'locked':
          setDigits(emptyCode());
          setNotice(view.notice);
          break;
        case 'session-expired':
          onChallengeEnded(view.notice);
          break;
        case 'retryable':
          setNotice(view.notice);
          break;
      }
    } finally {
      inFlight.current = false;
      setVerifying(false);
    }
  };

  const handleResendError = (view: ResendErrorView) => {
    switch (view.kind) {
      case 'cooldown':
        delayResend(view.retryAfterSeconds ?? FALLBACK_COOLDOWN_SECONDS);
        setNotice(view.notice);
        break;
      case 'session-expired':
        onChallengeEnded(view.notice);
        break;
      case 'retryable':
        setNotice(view.notice);
        break;
    }
  };

  const resend = async () => {
    if (inFlight.current || resendWait > 0) return;
    inFlight.current = true;
    setResending(true);
    setNotice(null);
    try {
      const next = await resendVerificationCode(challenge.mfaToken);
      setChallenge({
        email: challenge.email,
        mfaToken: next.mfaToken,
        resendAfterSeconds: next.resendAfterSeconds,
      });
      setDigits(emptyCode());
      setError(null);
      setNotice(NEW_CODE_SENT);
    } catch (err) {
      handleResendError(describeResendError(err));
    } finally {
      inFlight.current = false;
      setResending(false);
    }
  };

  const busy = verifying || resending;

  return (
    <>
      <div className="mb-6 flex gap-3 rounded-xl border border-line2 bg-paper/70 p-3.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-navy text-gold shadow-card">
          <MailIcon className="size-[18px]" />
        </span>
        <p className="min-w-0 text-[13px] leading-relaxed text-muted">
          <strong className="block font-semibold text-navy">Check your email</strong>
          We sent an {MFA_CODE_LENGTH}-digit verification code to{' '}
          <strong className="font-semibold break-all text-navy">{challenge.email}</strong>. The code
          works for 30 minutes.
        </p>
      </div>

      <form
        noValidate
        className="grid gap-5"
        aria-busy={busy}
        onSubmit={(e) => void handleSubmit(e)}
      >
        <div className="flex min-w-0 flex-col gap-2">
          <label id={`${id}-label`} htmlFor={id} className={LABEL_CLASS}>
            Verification code
          </label>
          <CodeInput
            id={id}
            digits={digits}
            onChange={changeDigits}
            onRejectedInput={() => setError(REJECTED_INPUT)}
            labelledBy={`${id}-label`}
            describedBy={error ? `${id}-hint ${id}-error` : `${id}-hint`}
            invalid={Boolean(error)}
            disabled={busy}
          />
          <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted">
            You can paste the whole code into any box.
          </p>
          {error && <FieldError id={`${id}-error`} message={error} />}
        </div>

        <Button type="submit" fullWidth disabled={busy} aria-busy={verifying}>
          {verifying && <Spinner />}
          {verifying ? 'Verifying…' : submitLabel}
        </Button>

        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted">
          <span>Didn’t get it? Check your spam folder, or</span>
          <Button
            type="button"
            variant="secondary"
            className="px-3 py-1.5 text-xs"
            disabled={busy || resendWait > 0}
            aria-busy={resending}
            onClick={() => void resend()}
          >
            {resending && <Spinner />}
            {resendWait > 0 ? `Resend code in ${resendWait}s` : 'Resend code'}
          </Button>
        </div>

        <AuthNotice notice={notice} />
      </form>
    </>
  );
}
