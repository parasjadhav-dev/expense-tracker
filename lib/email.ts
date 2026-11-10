import nodemailer from "nodemailer";

// Sends email. Two providers, picked from the environment:
//
//  1. SMTP (works with a plain Gmail account, no domain needed)
//       SMTP_USER       your address, e.g. you@gmail.com
//       SMTP_PASSWORD   a Google "app password" (not your normal password)
//       SMTP_HOST       default smtp.gmail.com
//       SMTP_PORT       default 465 (SSL); 587 uses STARTTLS
//       EMAIL_FROM      default: "Expense Tracker <SMTP_USER>". Gmail only
//                       sends as your own address.
//  2. Resend's HTTP API (needs a verified domain to email other people)
//       RESEND_API_KEY, EMAIL_FROM
//
// With neither set, outside production the message is printed to the server log
// so the flow can be tried locally. In production that is an error.

export type Email = { to: string; subject: string; text: string; html: string };

export type EmailConfig =
  | {
      provider: "smtp";
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
      from: string;
    }
  | { provider: "resend"; apiKey: string; from: string }
  | { provider: "none" };

const RESEND_DEFAULT_FROM = "Expense Tracker <onboarding@resend.dev>";

// Pure: reads the settings, decides the provider. SMTP wins if both are set.
export function emailConfig(env: Record<string, string | undefined>): EmailConfig {
  const user = env.SMTP_USER?.trim();
  const password = env.SMTP_PASSWORD?.replace(/\s+/g, ""); // Google shows app passwords with spaces
  if (user && password) {
    const port = Number(env.SMTP_PORT) || 465;
    const secure = env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465;
    return {
      provider: "smtp",
      host: env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port,
      secure,
      user,
      password,
      from: env.EMAIL_FROM?.trim() || `Expense Tracker <${user}>`,
    };
  }

  const apiKey = env.RESEND_API_KEY?.trim();
  if (apiKey) {
    return { provider: "resend", apiKey, from: env.EMAIL_FROM?.trim() || RESEND_DEFAULT_FROM };
  }

  return { provider: "none" };
}

export async function sendEmail(email: Email): Promise<void> {
  const config = emailConfig(process.env);

  if (config.provider === "none") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("No email provider is configured (set SMTP_USER and SMTP_PASSWORD, or RESEND_API_KEY).");
    }
    console.log(`[email:dev] To: ${email.to}\nSubject: ${email.subject}\n${email.text}`);
    return;
  }

  if (config.provider === "smtp") {
    const transport = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.password },
      // A hung mail server must not hang the request.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
    try {
      await transport.sendMail({
        from: config.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
    } finally {
      transport.close();
    }
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
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
