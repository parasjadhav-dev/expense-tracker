"use server";

import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { SAVE_FAILED_MESSAGE, logActionError } from "@/lib/action-errors";
import {
  buildResetUrl,
  canSendReset,
  generateResetToken,
  hashResetToken,
  RESET_WINDOW_MS,
  resetEmail,
  resetExpiry,
} from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export type ForgotPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
  values?: { email: string };
};

// The same answer whether or not the email has an account, so this form cannot
// be used to find out who is registered.
const SENT_MESSAGE =
  "If an account exists for that email, we have sent a link to reset the password. It works for 30 minutes.";

export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const raw = formData.get("email");
  const values = { email: typeof raw === "string" ? raw : "" };

  const parsed = forgotPasswordSchema.safeParse(values);
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message, values };
  }
  const { email } = parsed.data;

  try {
    const user = await db.user.findUnique({ where: { email }, select: { id: true } });

    if (user) {
      const now = new Date();
      const recent = await db.passwordResetToken.count({
        where: {
          userId: user.id,
          createdAt: { gte: new Date(now.getTime() - RESET_WINDOW_MS) },
        },
      });

      if (canSendReset(recent)) {
        const token = generateResetToken();
        // Only the newest link works: older unused ones are retired first.
        await db.$transaction([
          db.passwordResetToken.updateMany({
            where: { userId: user.id, usedAt: null },
            data: { usedAt: now },
          }),
          db.passwordResetToken.create({
            data: {
              tokenHash: hashResetToken(token),
              expiresAt: resetExpiry(now),
              userId: user.id,
            },
          }),
        ]);

        const appUrl = process.env.AUTH_URL || "http://localhost:3000";
        try {
          await sendEmail({ to: email, ...resetEmail(buildResetUrl(appUrl, token)) });
        } catch (error) {
          // Not shown to the visitor: it would reveal that the account exists.
          logActionError("requestPasswordReset:email", error);
        }
      }
    }
  } catch (error) {
    logActionError("requestPasswordReset", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE, values };
  }

  return { status: "success", message: SENT_MESSAGE };
}
