import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata = {
  title: "Create account | Expense Tracker",
};

export default function SignUpPage() {
  return (
    <main className="flex flex-1 w-full flex-col items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Create account
        </h1>
        <p className="mt-2 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Sign up with your email and a password.
        </p>
        <SignUpForm />
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
