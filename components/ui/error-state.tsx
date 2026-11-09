"use client";

import Link from "next/link";
import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { button, card, iconChip } from "@/lib/ui";

// What an unexpected failure looks like: a calm card, a way to try again and a
// way out. Server error details never reach the browser; the digest is only a
// reference that matches the server log.
export function ErrorState({
  error,
  retry,
  homeHref = "/dashboard",
  homeLabel = "Go to dashboard",
}: {
  error: unknown;
  retry: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && "digest" in error
      ? String((error as Error & { digest?: unknown }).digest ?? "")
      : "";

  return (
    <div
      role="alert"
      data-testid="error-state"
      className={`${card} mx-auto w-full max-w-md p-8 text-center`}
    >
      <span className={`${iconChip} mx-auto size-12`}>
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        We could not load this page. Your data is safe. Please try again in a
        moment.
      </p>
      {digest ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Reference: {digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={() => retry()} className={button("primary")}>
          Try again
        </button>
        <Link href={homeHref} className={button("secondary")}>
          {homeLabel}
        </Link>
      </div>
    </div>
  );
}
