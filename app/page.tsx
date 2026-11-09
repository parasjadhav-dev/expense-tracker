import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { logout } from "./login/actions";

export default function Home() {
  return (
    <main className="flex flex-1 w-full flex-col items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10">
        <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
          Expense Tracker
        </h1>
        <p className="mt-3 text-base leading-7 text-zinc-600 dark:text-zinc-400">
          Budgets, overspend alerts and your daily safe-to-spend amount are on
          the way.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <SessionStatus />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

async function SessionStatus() {
  // Mark this part as request-time before Auth.js runs. Session checks depend
  // on cookies and use random values, so they must not be prerendered.
  await connection();
  const session = await auth();

  if (!session?.user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
        >
          Log in
        </Link>
        <Link
          href="/sign-up"
          className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-950 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          Create account
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Signed in as{" "}
        <span className="font-medium">{session.user.email}</span>
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Log out
        </button>
      </form>
    </div>
  );
}
