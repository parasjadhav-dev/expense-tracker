"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SAVE_FAILED_MESSAGE, logActionError } from "@/lib/action-errors";
import { changePasswordSchema } from "@/lib/validations/auth";

export type ChangePasswordState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<
    Record<"currentPassword" | "newPassword" | "confirmPassword", string[]>
  >;
};

const BCRYPT_ROUNDS = 12;
const SESSION_ENDED: ChangePasswordState = {
  status: "error",
  message: "Your session has ended. Please log in again.",
};

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SESSION_ENDED;

  const parsed = changePasswordSchema.safeParse({
    currentPassword: text(formData, "currentPassword"),
    newPassword: text(formData, "newPassword"),
    confirmPassword: text(formData, "confirmPassword"),
  });
  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        currentPassword: flat.currentPassword,
        newPassword: flat.newPassword,
        confirmPassword: flat.confirmPassword,
      },
    };
  }

  const { currentPassword, newPassword } = parsed.data;

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) return SESSION_ENDED;

    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { currentPassword: ["That is not your current password."] },
      };
    }

    // Matched on the id and the old hash, so two simultaneous changes cannot
    // both succeed from the same starting password.
    const result = await db.user.updateMany({
      where: { id: userId, passwordHash: user.passwordHash },
      data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS) },
    });
    if (result.count !== 1) {
      return {
        status: "error",
        message:
          "Your password was changed somewhere else a moment ago. Please try again.",
      };
    }
  } catch (error) {
    logActionError("changePassword", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE };
  }

  return {
    status: "success",
    message: "Password changed. Use the new one next time you log in.",
  };
}
