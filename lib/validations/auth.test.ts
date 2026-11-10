import { describe, expect, it } from "vitest";
import { changePasswordSchema, signUpSchema } from "@/lib/validations/auth";

const ok = {
  currentPassword: "old-password",
  newPassword: "new-password-1",
  confirmPassword: "new-password-1",
};

function errorsFor(input: unknown): Record<string, string[]> {
  const result = changePasswordSchema.safeParse(input);
  if (result.success) return {};
  const out: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

describe("changePasswordSchema", () => {
  it("accepts a valid change", () => {
    expect(changePasswordSchema.safeParse(ok).success).toBe(true);
  });

  it("needs the current password", () => {
    expect(errorsFor({ ...ok, currentPassword: "" }).currentPassword).toBeDefined();
  });

  it("rejects a new password under 8 characters", () => {
    const e = errorsFor({ ...ok, newPassword: "short1", confirmPassword: "short1" });
    expect(e.newPassword?.[0]).toMatch(/at least 8/);
  });

  it("accepts exactly 8 and exactly 72 characters", () => {
    for (const n of [8, 72]) {
      const pw = "a".repeat(n);
      expect(
        changePasswordSchema.safeParse({ ...ok, newPassword: pw, confirmPassword: pw }).success,
      ).toBe(true);
    }
  });

  it("rejects more than 72 characters (bcrypt ignores the rest)", () => {
    const pw = "a".repeat(73);
    const e = errorsFor({ ...ok, newPassword: pw, confirmPassword: pw });
    expect(e.newPassword?.[0]).toMatch(/72/);
  });

  it("rejects a confirmation that does not match", () => {
    expect(errorsFor({ ...ok, confirmPassword: "different-1" }).confirmPassword?.[0]).toMatch(
      /do not match/,
    );
  });

  it("is case-sensitive when comparing the confirmation", () => {
    expect(errorsFor({ ...ok, confirmPassword: "NEW-PASSWORD-1" }).confirmPassword).toBeDefined();
  });

  it("rejects a new password equal to the current one", () => {
    const same = "same-password";
    const e = errorsFor({ currentPassword: same, newPassword: same, confirmPassword: same });
    expect(e.newPassword?.[0]).toMatch(/different/);
  });

  it("does not trim: spaces count as characters", () => {
    const pw = "        ";
    expect(
      changePasswordSchema.safeParse({ ...ok, newPassword: pw, confirmPassword: pw }).success,
    ).toBe(true);
  });

  it("rejects missing or non-string fields", () => {
    expect(changePasswordSchema.safeParse({}).success).toBe(false);
    expect(changePasswordSchema.safeParse({ ...ok, newPassword: 12345678 }).success).toBe(false);
  });
});

describe("signUpSchema password rules match change-password", () => {
  it("uses the same 8 to 72 limits", () => {
    const base = { email: "a@b.co" };
    expect(signUpSchema.safeParse({ ...base, password: "a".repeat(7) }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, password: "a".repeat(8) }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...base, password: "a".repeat(72) }).success).toBe(true);
    expect(signUpSchema.safeParse({ ...base, password: "a".repeat(73) }).success).toBe(false);
  });
});
