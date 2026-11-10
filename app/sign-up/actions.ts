"use server";

import bcrypt from "bcryptjs";
import { after } from "next/server";
import { z } from "zod";
import { logActionError } from "@/lib/action-errors";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/welcome-email";
import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { signUpSchema } from "@/lib/validations/auth";

export type SignUpState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "password", string[]>>;
  // Echoed back so the form can refill itself after an error. Never the password.
  values?: { name: string; email: string };
};

const BCRYPT_ROUNDS = 12;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function signUp(
  _prevState: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const values = { name: text(formData, "name"), email: text(formData, "email") };

  const parsed = signUpSchema.safeParse({
    name: values.name || undefined,
    email: values.email,
    password: text(formData, "password"),
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error).fieldErrors;
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: {
        name: flat.name,
        email: flat.email,
        password: flat.password,
      },
      values,
    };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    // The user and their default categories are created together or not at all.
    await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        categories: {
          create: DEFAULT_CATEGORIES.map((categoryName) => ({
            name: categoryName,
          })),
        },
      },
    });
  } catch (error) {
    // The unique constraint on User.email decides duplicates, so two
    // simultaneous sign-ups with the same email cannot both succeed.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return {
        status: "error",
        message: "An account with this email already exists.",
        fieldErrors: { email: ["This email is already registered."] },
        values,
      };
    }
    throw error;
  }

  // Send the welcome email after the response, so sign-up is not slowed down.
  // If it fails, the account still exists: the failure is only logged.
  after(async () => {
    try {
      await sendEmail({
        to: email,
        ...welcomeEmail({ name, appUrl: process.env.AUTH_URL || "http://localhost:3000" }),
      });
    } catch (error) {
      logActionError("signUp:welcomeEmail", error);
    }
  });

  return {
    status: "success",
    message: "Account created. You can now log in.",
  };
}
