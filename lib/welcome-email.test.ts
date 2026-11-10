import { describe, expect, it } from "vitest";
import { escapeHtml, welcomeEmail } from "@/lib/welcome-email";

describe("escapeHtml", () => {
  it("escapes the characters that can start markup or break an attribute", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
    );
  });

  it("leaves ordinary text alone", () => {
    expect(escapeHtml("Aarav Sharma, रमेश")).toBe("Aarav Sharma, रमेश");
  });
});

describe("welcomeEmail", () => {
  const base = { appUrl: "https://app.example.com" };

  it("greets the user by name and has a login link", () => {
    const mail = welcomeEmail({ ...base, name: "Aarav" });
    expect(mail.subject).toBe("Welcome to Expense Tracker");
    expect(mail.text).toContain("Hi Aarav,");
    expect(mail.html).toContain("Hi Aarav,");
    expect(mail.text).toContain("https://app.example.com/login");
    expect(mail.html).toContain('href="https://app.example.com/login"');
  });

  it("works without a name", () => {
    for (const name of [undefined, "", "   "]) {
      const mail = welcomeEmail({ ...base, name });
      expect(mail.text.startsWith("Hi,\n")).toBe(true);
      expect(mail.html.startsWith("<p>Hi,</p>")).toBe(true);
    }
  });

  it("escapes a hostile name in the HTML version", () => {
    const mail = welcomeEmail({ ...base, name: `<img src=x onerror=alert(1)>` });
    expect(mail.html).not.toContain("<img");
    expect(mail.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("keeps a name with line breaks on one line in the text version", () => {
    const mail = welcomeEmail({ ...base, name: "Aarav\r\nBcc: evil@example.com" });
    expect(mail.text.split("\n")[0]).toBe("Hi Aarav Bcc: evil@example.com,");
  });

  it("copes with a trailing slash on the app URL", () => {
    expect(welcomeEmail({ appUrl: "https://app.example.com/", name: "A" }).text).toContain(
      "https://app.example.com/login",
    );
  });

  it("mentions the three starting steps and how to ignore it", () => {
    const { text } = welcomeEmail({ ...base, name: "A" });
    expect(text).toMatch(/import/i);
    expect(text).toMatch(/budget/i);
    expect(text).toMatch(/Recurring/);
    expect(text).toMatch(/did not create this account/);
  });
});
