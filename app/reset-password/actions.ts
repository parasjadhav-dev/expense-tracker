"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { SAVE_FAILED_MESSAGE, logActionError } from "@/lib/action-errors";
import { hashResetToken, isResetUsable } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/validations/auth";

export type ResetPasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"newPassword" | "confirmPassword", string[]>>;
};

const BCRYPT_ROUNDS = 12;
const INVALID_LINK: ResetPasswordState = {
  status: "error",
  message: "This reset link is invalid or has expired. Request a new one.",
};

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function resetPassword(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: text(formData, "token"),
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors;
    if (flat.token) return INVALID_LINK;
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        newPassword: flat.newPassword,
        confirmPassword: flat.confirmPassword,
      },
    };
  }

  const { token, newPassword } = parsed.data;

  try {
    const record = await db.passwordResetToken.findUnique({
      where: { tokenHash: hashResetToken(token) },
    });
    const now = new Date();
    if (!record || !isResetUsable(record, now)) return INVALID_LINK;

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Using the link and setting the password happen together or not at all.
    // The claim only succeeds once, so two clicks cannot both reset.
    const done = await db.$transaction(async (tx) => {
      const claim = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      });
      if (claim.count !== 1) return false;

      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
      // Any other pending link for this account stops working too.
      await tx.passwordResetToken.updateMany({
        where: { userId: record.userId, usedAt: null },
        data: { usedAt: now },
      });
      return true;
    });
    if (!done) return INVALID_LINK;
  } catch (error) {
    logActionError("resetPassword", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE };
  }

  return { status: "success", message: "Password updated. You can now log in with it." };
}
