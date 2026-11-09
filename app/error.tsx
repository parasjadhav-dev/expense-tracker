"use client";

import { ErrorState } from "@/components/ui/error-state";
import { Logo } from "@/components/ui/logo";

// A failure on a public page (home, login, sign-up).
export default function RootError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 bg-[#f5f6fa] px-5 py-16 dark:bg-black">
      <Logo />
      <ErrorState
        error={error}
        retry={retry}
        homeHref="/"
        homeLabel="Back to home"
      />
    </main>
  );
}
