import { emailRow, renderEmail } from '../../infrastructure/email/email-layout.js';
import type { EmailMessage } from '../../infrastructure/email/email-sender.js';

const VERIFICATION_EMAIL_SUBJECT = 'Account verification code';

export interface VerificationEmailContent {
  to: string;
  code: string;
  validForMinutes: number;
  privacyStatementUrl: string | null;
}

export function verificationEmail({
  to,
  code,
  validForMinutes,
  privacyStatementUrl,
}: VerificationEmailContent): EmailMessage {
  const html = renderEmail({
    heading: 'Account verification code',
    rows: [
      emailRow(
        `To access <strong>Seventh Vote</strong>&#39;s application and resources, please use the code below for account verification.
            The code will only work for ${validForMinutes} minutes.`,
      ),
      emailRow('Account verification code:', 'font-size:16px;line-height:1.6', 6),
      emailRow(code, 'font-size:24px;line-height:1.3;font-weight:700;letter-spacing:1px'),
      emailRow('If you didn&#39;t request a code, you can ignore this email.'),
    ],
    privacyStatementUrl,
  });

  return { to, subject: VERIFICATION_EMAIL_SUBJECT, html };
}
