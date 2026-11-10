import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { link } from "@/lib/ui";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = {
  title: "Forgot password | Expense Tracker",
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we will send you a link to choose a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className={link}>
            Log in
          </Link>
        </>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
