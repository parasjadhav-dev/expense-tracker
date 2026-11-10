import { describe, expect, it } from "vitest";
import {
  RESET_MAX_PER_WINDOW,
  RESET_TTL_MS,
  buildResetUrl,
  canSendReset,
  generateResetToken,
  hashResetToken,
  isResetUsable,
  resetEmail,
  resetExpiry,
} from "@/lib/password-reset";
import { forgotPasswordSchema, resetPasswordSchema } from "@/lib/validations/auth";

describe("generateResetToken", () => {
  it("is long, URL-safe and different every time", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const token = generateResetToken();
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes as base64url
      seen.add(token);
    }
    expect(seen.size).toBe(200);
  });
});

describe("hashResetToken", () => {
  it("is deterministic, hex, and never equals the token", () => {
    const token = generateResetToken();
    expect(hashResetToken(token)).toBe(hashResetToken(token));
    expect(hashResetToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashResetToken(token)).not.toBe(token);
  });

  it("differs for different tokens, even one character apart", () => {
    expect(hashResetToken("abc")).not.toBe(hashResetToken("abd"));
  });

  it("matches the known SHA-256 of a fixed input", () => {
    expect(hashResetToken("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("expiry", () => {
  const now = new Date("2026-11-10T10:00:00.000Z");

  it("expires 30 minutes after it is made", () => {
    expect(RESET_TTL_MS).toBe(30 * 60 * 1000);
    expect(resetExpiry(now).toISOString()).toBe("2026-11-10T10:30:00.000Z");
  });

  it("is usable just before expiry and not at or after it", () => {
    const expiresAt = resetExpiry(now);
    const before = new Date(expiresAt.getTime() - 1);
    expect(isResetUsable({ expiresAt, usedAt: null }, before)).toBe(true);
    expect(isResetUsable({ expiresAt, usedAt: null }, expiresAt)).toBe(false);
    expect(isResetUsable({ expiresAt, usedAt: null }, new Date(expiresAt.getTime() + 1))).toBe(false);
  });

  it("is never usable once used, even if not expired", () => {
    expect(isResetUsable({ expiresAt: resetExpiry(now), usedAt: now }, now)).toBe(false);
  });
});

describe("canSendReset", () => {
  it("allows up to the limit and blocks after it", () => {
    expect(RESET_MAX_PER_WINDOW).toBe(3);
    expect(canSendReset(0)).toBe(true);
    expect(canSendReset(2)).toBe(true);
    expect(canSendReset(3)).toBe(false);
    expect(canSendReset(10)).toBe(false);
  });
});

describe("buildResetUrl", () => {
  it("builds the link from the app URL", () => {
    expect(buildResetUrl("https://app.example.com", "tok")).toBe(
      "https://app.example.com/reset-password?token=tok",
    );
  });

  it("copes with trailing slashes", () => {
    expect(buildResetUrl("https://app.example.com/", "tok")).toBe(
      "https://app.example.com/reset-password?token=tok",
    );
    expect(buildResetUrl("http://localhost:3000///", "tok")).toBe(
      "http://localhost:3000/reset-password?token=tok",
    );
  });

  it("encodes the token so it cannot break out of the query", () => {
    expect(buildResetUrl("https://a.b", "x&y=1 z")).toBe(
      "https://a.b/reset-password?token=x%26y%3D1%20z",
    );
  });

  it("round-trips a real token unchanged", () => {
    const token = generateResetToken();
    const url = new URL(buildResetUrl("https://a.b", token));
    expect(url.searchParams.get("token")).toBe(token);
  });
});

describe("resetEmail", () => {
  const url = "https://a.b/reset-password?token=abc";
  const mail = resetEmail(url);

  it("contains the link in both the text and html versions", () => {
    expect(mail.text).toContain(url);
    expect(mail.html).toContain(url);
  });

  it("says how long the link works and what to do if it was not you", () => {
    expect(mail.text).toMatch(/30 minutes/);
    expect(mail.text).toMatch(/not you/i);
  });
});

describe("forgotPasswordSchema", () => {
  it("accepts and normalises an email", () => {
    const result = forgotPasswordSchema.safeParse({ email: "  Me@Example.COM " });
    expect(result.success && result.data.email).toBe("me@example.com");
  });

  it("rejects empty and malformed emails", () => {
    for (const email of ["", "   ", "not-an-email", "a@", "@b.co"]) {
      expect(forgotPasswordSchema.safeParse({ email }).success, email).toBe(false);
    }
  });
});

describe("resetPasswordSchema", () => {
  const token = "t".repeat(43);
  const ok = { token, newPassword: "a-good-pass1", confirmPassword: "a-good-pass1" };

  it("accepts a valid reset", () => {
    expect(resetPasswordSchema.safeParse(ok).success).toBe(true);
  });

  it("rejects a missing or absurd token", () => {
    expect(resetPasswordSchema.safeParse({ ...ok, token: "" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...ok, token: "short" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ ...ok, token: "t".repeat(500) }).success).toBe(false);
  });

  it("applies the 8 to 72 character password rule", () => {
    const both = (pw: string) => ({ ...ok, newPassword: pw, confirmPassword: pw });
    expect(resetPasswordSchema.safeParse(both("a".repeat(7))).success).toBe(false);
    expect(resetPasswordSchema.safeParse(both("a".repeat(8))).success).toBe(true);
    expect(resetPasswordSchema.safeParse(both("a".repeat(72))).success).toBe(true);
    expect(resetPasswordSchema.safeParse(both("a".repeat(73))).success).toBe(false);
  });

  it("rejects mismatched confirmation", () => {
    expect(resetPasswordSchema.safeParse({ ...ok, confirmPassword: "different-1" }).success).toBe(false);
  });
});
