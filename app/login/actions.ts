"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { loginSchema } from "@/lib/validations/auth";
import { safeCallbackUrl } from "@/lib/redirect";

export type LoginState = {
  status: "idle" | "error";
  message?: string;
  // Echoed back so the form can refill the email after an error.
  values?: { email: string };
};

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const rawEmail = formData.get("email");
  const values = { email: typeof rawEmail === "string" ? rawEmail : "" };

  const parsed = loginSchema.safeParse({
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0].message, values };
  }

  try {
    // On success this throws Next's redirect, which must not be caught here.
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeCallbackUrl(formData.get("callbackUrl")),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: "error", message: "Invalid email or password.", values };
    }
    throw error;
  }

  return { status: "idle" };
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
