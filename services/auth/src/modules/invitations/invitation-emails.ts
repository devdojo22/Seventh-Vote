import { Role } from '@prisma/client';
import { EMAIL_BLUE, EMAIL_FONT, emailRow, escapeHtml, renderEmail } from '../../infrastructure/email/email-layout.js';
import type { EmailMessage } from '../../infrastructure/email/email-sender.js';

interface InvitationEmail {
  to: string;
  workspaceName: string;
  role: Role;
  acceptUrl: string;
  validForHours: number;
  privacyStatementUrl: string | null;
}

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  [Role.PRINCIPAL]: 'as its <strong>Principal</strong>, the workspace owner who manages its members and settings',
  [Role.AFFILIATE]: 'as an <strong>Affiliate</strong>',
};

export function invitationEmail({
  to,
  workspaceName,
  role,
  acceptUrl,
  validForHours,
  privacyStatementUrl,
}: InvitationEmail): EmailMessage {
  const href = escapeHtml(acceptUrl);
  const workspace = escapeHtml(workspaceName);
  const html = renderEmail({
    heading: 'You are invited to Seventh Vote',
    rows: [
      emailRow(
        `You have been invited to join the <strong>${workspace}</strong> workspace on Seventh Vote ${ROLE_DESCRIPTIONS[role]}.
            The invitation works for ${validForHours} hours and can be used once.`,
      ),
      emailRow(
        `<a href="${href}" style="display:inline-block;padding:12px 28px;border-radius:6px;background:${EMAIL_BLUE};color:#ffffff;font-family:${EMAIL_FONT};font-size:16px;font-weight:600;text-decoration:none">Accept invitation</a>`,
      ),
      emailRow(
        `If the button doesn&#39;t work, copy this link into your browser:<br /><a href="${href}" style="color:${EMAIL_BLUE};word-break:break-all">${href}</a>`,
        'font-size:14px;line-height:1.6',
      ),
      emailRow('If you weren&#39;t expecting this invitation, you can ignore this email.'),
    ],
    privacyStatementUrl,
  });
  return { to, subject: `Invitation to ${workspaceName} on Seventh Vote`, html };
}
