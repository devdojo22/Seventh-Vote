import { EMAIL_BLUE, EMAIL_FONT, emailRow, escapeHtml, renderEmail } from '../../infrastructure/email/email-layout.js';
import type { EmailMessage } from '../../infrastructure/email/email-sender.js';

const CHANGED_AT_FORMAT = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'UTC',
});

interface ResetLinkEmail {
  to: string;
  resetUrl: string;
  validForMinutes: number;
  privacyStatementUrl: string | null;
}

export function passwordResetEmail({
  to,
  resetUrl,
  validForMinutes,
  privacyStatementUrl,
}: ResetLinkEmail): EmailMessage {
  const href = escapeHtml(resetUrl);
  const html = renderEmail({
    heading: 'Reset your password',
    rows: [
      emailRow(
        `We received a request to reset the password for your <strong>Seventh Vote</strong> account.
            Use the button below to choose a new password. The link will only work for ${validForMinutes} minutes and can be used once.`,
      ),
      emailRow(
        `<a href="${href}" style="display:inline-block;padding:12px 28px;border-radius:6px;background:${EMAIL_BLUE};color:#ffffff;font-family:${EMAIL_FONT};font-size:16px;font-weight:600;text-decoration:none">Reset password</a>`,
      ),
      emailRow(
        `If the button doesn&#39;t work, copy this link into your browser:<br /><a href="${href}" style="color:${EMAIL_BLUE};word-break:break-all">${href}</a>`,
        'font-size:14px;line-height:1.6',
      ),
      emailRow(
        'If you didn&#39;t request a password reset, you can ignore this email. Your password won&#39;t change.',
      ),
    ],
    privacyStatementUrl,
  });
  return { to, subject: 'Reset your Seventh Vote password', html };
}

interface PasswordChangedEmail {
  to: string;
  changedAt: Date;
  privacyStatementUrl: string | null;
}

export function passwordChangedEmail({ to, changedAt, privacyStatementUrl }: PasswordChangedEmail): EmailMessage {
  const html = renderEmail({
    heading: 'Your password was changed',
    rows: [
      emailRow(
        `The password for your <strong>Seventh Vote</strong> account was changed on ${escapeHtml(CHANGED_AT_FORMAT.format(changedAt))} UTC.
            For your security, you have been signed out on all devices.`,
      ),
      emailRow('If you didn&#39;t make this change, contact your administrator right away.'),
    ],
    privacyStatementUrl,
  });
  return { to, subject: 'Your Seventh Vote password was changed', html };
}
