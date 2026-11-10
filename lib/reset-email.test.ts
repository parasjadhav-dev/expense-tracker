import { describe, expect, it } from "vitest";
import { buildResetUrl, generateResetToken } from "@/lib/password-reset";
import { resetEmail } from "@/lib/reset-email";

const url = "https://app.example.com/reset-password?token=abc123";

describe("resetEmail", () => {
  it("has a clear subject", () => {
    expect(resetEmail({ resetUrl: url }).subject).toBe("Reset your Expense Tracker password");
  });

  it("contains the link in both versions, and in the button", () => {
    const mail = resetEmail({ resetUrl: url, name: "Aarav" });
    expect(mail.text).toContain(url);
    expect(mail.html).toContain(`href="${url}"`);
    expect(mail.html).toContain(">Choose a new password</a>");
  });

  it("also shows the plain address as a fallback for a broken button", () => {
    const html = resetEmail({ resetUrl: url }).html;
    expect(html.split(url).length - 1).toBeGreaterThanOrEqual(2); // button + visible text
    expect(html).toMatch(/Button not working/);
  });

  it("states that the link is single-use and when it expires", () => {
    for (const body of [resetEmail({ resetUrl: url }).text, resetEmail({ resetUrl: url }).html]) {
      expect(body).toMatch(/once/);
      expect(body).toMatch(/30 minutes/);
    }
  });

  it("tells a person who did not ask that nothing changed, and warns not to share", () => {
    const { text } = resetEmail({ resetUrl: url });
    expect(text).toMatch(/Did not ask for this/);
    expect(text).toMatch(/password has not changed/i);
    expect(text).toMatch(/Never share this link/);
  });

  it("greets by name, or plainly without one", () => {
    expect(resetEmail({ resetUrl: url, name: "Aarav" }).text.startsWith("Hi Aarav,\n")).toBe(true);
    for (const name of [undefined, null, "", "  "]) {
      expect(resetEmail({ resetUrl: url, name }).text.startsWith("Hi,\n")).toBe(true);
    }
  });

  it("escapes a hostile name in the HTML and keeps it on one line in the text", () => {
    const mail = resetEmail({ resetUrl: url, name: "<img src=x onerror=alert(1)>\r\nBcc: evil@example.com" });
    expect(mail.html).not.toContain("<img");
    expect(mail.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(mail.text.split("\n")[0]).toBe("Hi <img src=x onerror=alert(1)> Bcc: evil@example.com,");
  });

  it("escapes the link in HTML attributes", () => {
    const html = resetEmail({ resetUrl: 'https://a.b/x?token=1&y="><script>' }).html;
    expect(html).not.toContain("<script>");
    expect(html).toContain("&amp;y=&quot;&gt;&lt;script&gt;");
  });

  it("keeps a real generated link intact", () => {
    const link = buildResetUrl("https://app.example.com", generateResetToken());
    const mail = resetEmail({ resetUrl: link });
    expect(mail.text).toContain(link);
    expect(mail.html).toContain(`href="${link}"`);
  });

  it("is a complete HTML document that uses no scripts or remote images", () => {
    const { html } = resetEmail({ resetUrl: url });
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).not.toMatch(/<script|<img|<link|@import|url\(/i);
  });
});
