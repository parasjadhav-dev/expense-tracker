import { createHash, randomBytes } from "node:crypto";

// Pure helpers for the "forgot password" flow (no database, no network), so the
// rules are easy to test.

// How long a reset link works.
export const RESET_TTL_MS = 30 * 60 * 1000;

// At most this many reset emails per account in RESET_WINDOW_MS. Stops someone
// from filling a stranger's inbox through the "forgot password" form.
export const RESET_MAX_PER_WINDOW = 3;
export const RESET_WINDOW_MS = 60 * 60 * 1000;

// 32 random bytes as URL-safe text: 256 bits, not guessable.
export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

// Only this hash is stored. SHA-256 is enough here (not bcrypt) because the
// token is random, not a human-chosen password.
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function resetExpiry(now: Date): Date {
  return new Date(now.getTime() + RESET_TTL_MS);
}

export function isResetUsable(
  token: { expiresAt: Date; usedAt: Date | null },
  now: Date,
): boolean {
  return token.usedAt === null && token.expiresAt.getTime() > now.getTime();
}

export function canSendReset(recentCount: number): boolean {
  return recentCount < RESET_MAX_PER_WINDOW;
}

// The link in the email. Built from the configured app URL, never from the
// request's Host header, so a forged header cannot point the link elsewhere.
export function buildResetUrl(appUrl: string, token: string): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
}

export function resetEmail(resetUrl: string): {
  subject: string;
  text: string;
  html: string;
} {
  const minutes = RESET_TTL_MS / 60000;
  return {
    subject: "Reset your Expense Tracker password",
    text: [
      "Someone asked to reset the password for your Expense Tracker account.",
      "",
      `Open this link to choose a new password (it works for ${minutes} minutes, once):`,
      resetUrl,
      "",
      "If this was not you, ignore this email. Your password stays the same.",
    ].join("\n"),
    html: `<p>Someone asked to reset the password for your Expense Tracker account.</p>
<p><a href="${resetUrl}">Choose a new password</a></p>
<p>The link works for ${minutes} minutes and only once.</p>
<p>If this was not you, ignore this email. Your password stays the same.</p>`,
  };
}
