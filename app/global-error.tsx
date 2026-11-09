"use client";

import "./globals.css";
import { ErrorState } from "@/components/ui/error-state";

// The last resort: the root layout itself failed, so this brings its own
// document.
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-[#f5f6fa] px-5 font-sans">
        <title>Something went wrong | Expense Tracker</title>
        <ErrorState error={error} retry={retry} homeHref="/" homeLabel="Back to home" />
      </body>
    </html>
  );
}
