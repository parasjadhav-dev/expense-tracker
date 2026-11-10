// Sends email through Resend's HTTP API (no extra package needed).
//
//   RESEND_API_KEY  required to really send
//   EMAIL_FROM      for example  "Expense Tracker <noreply@yourdomain.com>".
//                   Without your own verified domain, Resend only delivers
//                   from onboarding@resend.dev to the email of your Resend
//                   account, which is enough for testing.
//
// With no API key, outside production the message is printed to the server log
// instead, so the flow can be tried locally. In production a missing key is an
// error.

export type Email = { to: string; subject: string; text: string; html: string };

const DEFAULT_FROM = "Expense Tracker <onboarding@resend.dev>";

export async function sendEmail(email: Email): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("RESEND_API_KEY is not set, so email cannot be sent.");
    }
    console.log(`[email:dev] To: ${email.to}\nSubject: ${email.subject}\n${email.text}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || DEFAULT_FROM,
      to: [email.to],
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    // The body can name the recipient; keep the log to the status and Resend's message.
    let detail = "";
    try {
      detail = ((await response.json()) as { message?: string }).message ?? "";
    } catch {
      // not JSON
    }
    throw new Error(`Resend rejected the email (${response.status}) ${detail}`.trim());
  }
}
