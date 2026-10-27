import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Card } from '@/components/ui/Card';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { useVerificationChallengeStore } from '@/stores/verification-challenge-store';
import {
  AuthHeading,
  AuthNotice,
  PRIMARY_LINK_CLASS,
  TEXT_LINK_CLASS,
  type AuthNoticeContent,
} from './AuthControls';
import { verifyLoginMfa } from './auth-api';
import { startSession } from './auth-session';
import { EmailCodeForm } from './EmailCodeForm';
import { readReturnTo } from './return-to';

const NO_CHALLENGE_NOTICE: AuthNoticeContent = {
  title: 'No sign-in in progress',
  body: 'Sign-in challenges are kept only while this page stays open. Please sign in with your email and password first.',
};

export function MfaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const challenge = useVerificationChallengeStore((s) => s.challenge);
  const clearChallenge = useVerificationChallengeStore((s) => s.clearChallenge);
  const [endedNotice, setEndedNotice] = useState<AuthNoticeContent | null>(null);

  const verify = async (mfaToken: string, code: string) => {
    startSession(await verifyLoginMfa(mfaToken, code));
    clearChallenge();
    void navigate(readReturnTo(location.state), { replace: true });
  };

  const endChallenge = (notice: AuthNoticeContent) => {
    clearChallenge();
    setEndedNotice(notice);
  };

  return (
    <section>
      <AuthHeading
        eyebrow="Two-step verification"
        title="Verify your identity"
        description="Your password was only the first step. Enter the 8-digit code we emailed you to finish signing in."
      />

      <Card className="sm:p-7">
        {challenge ? (
          <EmailCodeForm
            challenge={challenge}
            id="mfa-code"
            submitLabel="Verify and enter"
            onVerify={verify}
            onChallengeEnded={endChallenge}
          />
        ) : (
          <div className="grid gap-4">
            <AuthNotice notice={endedNotice ?? NO_CHALLENGE_NOTICE} />
            <Link to="/login" className={PRIMARY_LINK_CLASS}>
              Go to sign in
            </Link>
          </div>
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
