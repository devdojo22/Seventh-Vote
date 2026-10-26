export const EMAIL_FONT = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
export const EMAIL_BLUE = '#3b6fd8';
const EMAIL_TEXT = '#222222';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function emailRow(html: string, style = 'font-size:16px;line-height:1.6', paddingBottom = 32): string {
  return `<tr><td style="padding:0 0 ${paddingBottom}px;font-family:${EMAIL_FONT};${style}">${html}</td></tr>`;
}

interface EmailLayout {
  heading: string;
  rows: readonly string[];
  privacyStatementUrl: string | null;
}

export function renderEmail({ heading, rows, privacyStatementUrl }: EmailLayout): string {
  const title = escapeHtml(heading);
  const privacyLink =
    privacyStatementUrl === null
      ? ''
      : `<tr><td style="padding:8px 0 0;font-family:${EMAIL_FONT};font-size:15px">
          <a href="${escapeHtml(privacyStatementUrl)}" style="color:${EMAIL_BLUE};text-decoration:underline">Privacy Statement</a>
        </td></tr>`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#ffffff">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
      <tr><td style="padding:32px 24px">
        <table role="presentation" align="left" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0;color:${EMAIL_TEXT}">
          <tr><td style="padding:0 0 32px;font-family:${EMAIL_FONT};font-size:40px;line-height:1.15;font-weight:400;color:${EMAIL_BLUE}">${title}</td></tr>
          ${rows.join('\n          ')}
          ${privacyLink}
        </table>
      </td></tr>
    </table>
  </body>
</html>
`;
}
