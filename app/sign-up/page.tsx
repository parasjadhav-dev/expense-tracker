import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { link } from "@/lib/ui";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Create account | Expense Tracker",
};

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your account"
      description="Start tracking spending and budgets in a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={link}>
            Log in
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthShell>
  );
}
