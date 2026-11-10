import { describe, expect, it } from "vitest";
import { emailConfig } from "@/lib/email";

describe("emailConfig", () => {
  it("has no provider when nothing is set", () => {
    expect(emailConfig({})).toEqual({ provider: "none" });
  });

  it("uses Gmail SMTP defaults when a user and password are set", () => {
    expect(emailConfig({ SMTP_USER: "me@gmail.com", SMTP_PASSWORD: "abcdabcdabcdabcd" })).toEqual({
      provider: "smtp",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      user: "me@gmail.com",
      password: "abcdabcdabcdabcd",
      from: "Expense Tracker <me@gmail.com>",
    });
  });

  it("removes the spaces Google puts in app passwords", () => {
    const config = emailConfig({ SMTP_USER: "me@gmail.com", SMTP_PASSWORD: "abcd efgh ijkl mnop" });
    expect(config.provider === "smtp" && config.password).toBe("abcdefghijklmnop");
  });

  it("treats port 587 as STARTTLS (not secure) unless told otherwise", () => {
    const base = { SMTP_USER: "me@gmail.com", SMTP_PASSWORD: "x" };
    const a = emailConfig({ ...base, SMTP_PORT: "587" });
    expect(a.provider === "smtp" && a.secure).toBe(false);
    const b = emailConfig({ ...base, SMTP_PORT: "587", SMTP_SECURE: "true" });
    expect(b.provider === "smtp" && b.secure).toBe(true);
  });

  it("falls back to 465 for a junk port and honours a custom host and sender", () => {
    const c = emailConfig({
      SMTP_USER: "u",
      SMTP_PASSWORD: "p",
      SMTP_PORT: "abc",
      SMTP_HOST: " mail.example.com ",
      EMAIL_FROM: "Tracker <hi@example.com>",
    });
    expect(c).toMatchObject({ port: 465, host: "mail.example.com", from: "Tracker <hi@example.com>" });
  });

  it("needs both the SMTP user and password", () => {
    expect(emailConfig({ SMTP_USER: "me@gmail.com" })).toEqual({ provider: "none" });
    expect(emailConfig({ SMTP_PASSWORD: "x" })).toEqual({ provider: "none" });
    expect(emailConfig({ SMTP_USER: "me@gmail.com", SMTP_PASSWORD: "  " })).toEqual({ provider: "none" });
  });

  it("uses Resend when only an API key is set", () => {
    expect(emailConfig({ RESEND_API_KEY: "re_x" })).toEqual({
      provider: "resend",
      apiKey: "re_x",
      from: "Expense Tracker <onboarding@resend.dev>",
    });
  });

  it("prefers SMTP over Resend when both are set", () => {
    const c = emailConfig({ SMTP_USER: "me@gmail.com", SMTP_PASSWORD: "x", RESEND_API_KEY: "re_x" });
    expect(c.provider).toBe("smtp");
  });
});
