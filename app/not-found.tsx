import Link from "next/link";
import { Compass } from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { button, card, iconChip } from "@/lib/ui";

export const metadata = {
  title: "Page not found | Expense Tracker",
};

// Shown for any address that does not exist (and for another user's expense id).
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#f5f6fa] px-5 py-16 dark:bg-black">
      <Logo />
      <div className={`${card} w-full max-w-md p-8 text-center`}>
        <span className={`${iconChip} mx-auto size-12`}>
          <Compass className="size-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm font-medium text-[#1c5cab] dark:text-[#6da7ec]">
          404
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This page could not be found. It may have been moved, or the address
          may be wrong.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className={button("primary")}>
            Go to dashboard
          </Link>
          <Link href="/" className={button("secondary")}>
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
