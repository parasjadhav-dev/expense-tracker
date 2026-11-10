import { RESET_TTL_MS } from "@/lib/password-reset";
import { escapeHtml } from "@/lib/welcome-email";

// The "reset your password" email. Pure (no network), so it is easy to test.
// The HTML uses tables and inline styles because email apps ignore most CSS.

const BLUE = "#2a78d6";

function cleanName(name: string | null | undefined): string {
  return (name ?? "").replace(/[\r\n\t]+/g, " ").trim();
}

export function resetEmail({
  resetUrl,
  name,
}: {
  resetUrl: string;
  name?: string | null;
}): { subject: string; text: string; html: string } {
  const minutes = RESET_TTL_MS / 60000;
  const who = cleanName(name);
  const greeting = who ? `Hi ${who},` : "Hi,";
  const url = escapeHtml(resetUrl);

  const text = [
    greeting,
    "",
    "We got a request to reset the password for your Expense Tracker account.",
    "",
    "Choose a new password here:",
    resetUrl,
    "",
    `This link works once and expires in ${minutes} minutes.`,
    "",
    "Did not ask for this? You can ignore this email. Your password has not changed and nobody can use this link without the email.",
    "",
    "Never share this link with anyone, and we will never ask you for your password.",
    "",
    "Expense Tracker",
  ].join("\n");

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reset your Expense Tracker password</title>
</head>
<body style="margin:0;padding:0;background:#f5f6fa;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6fa;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;border:1px solid #e4e4e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
<tr><td style="padding:28px 32px 8px 32px;font-size:15px;font-weight:600;color:${BLUE};">Expense Tracker</td></tr>
<tr><td style="padding:8px 32px 0 32px;font-size:24px;font-weight:700;line-height:1.3;">Reset your password</td></tr>
<tr><td style="padding:16px 32px 0 32px;font-size:15px;line-height:1.6;">${escapeHtml(greeting)}<br><br>We got a request to reset the password for your Expense Tracker account. Press the button to choose a new one.</td></tr>
<tr><td style="padding:24px 32px 8px 32px;">
<a href="${url}" style="display:inline-block;background:${BLUE};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:13px 26px;border-radius:10px;">Choose a new password</a>
</td></tr>
<tr><td style="padding:8px 32px 0 32px;font-size:13px;line-height:1.6;color:#52525b;">This link works once and expires in ${minutes} minutes.</td></tr>
<tr><td style="padding:20px 32px 0 32px;font-size:13px;line-height:1.6;color:#52525b;">Button not working? Copy this address into your browser:<br><a href="${url}" style="color:${BLUE};word-break:break-all;">${url}</a></td></tr>
<tr><td style="padding:24px 32px 0 32px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;border-radius:10px;"><tr><td style="padding:14px 16px;font-size:13px;line-height:1.6;color:#3f3f46;"><strong>Did not ask for this?</strong> You can ignore this email. Your password has not changed. Never share this link with anyone, and we will never ask you for your password.</td></tr></table>
</td></tr>
<tr><td style="padding:24px 32px 28px 32px;font-size:12px;line-height:1.6;color:#71717a;">You received this because someone entered your email address on the Expense Tracker &quot;Forgot password&quot; page.</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return { subject: "Reset your Expense Tracker password", text, html };
}
