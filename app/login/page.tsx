import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { safeCallbackUrl } from "@/lib/redirect";

export const metadata = {
  title: "Log in | Expense Tracker",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <main className="flex flex-1 w-full flex-col items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10">
        <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Log in
        </h1>
        <p className="mt-2 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Welcome back. Enter your email and password.
        </p>
        <Suspense fallback={null}>
          <LoginFormWithParams searchParams={searchParams} />
        </Suspense>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Don&apos;t have an account?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
          >
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}

async function LoginFormWithParams({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />;
}
