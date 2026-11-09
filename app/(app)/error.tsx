"use client";

import { ErrorState } from "@/components/ui/error-state";

// A failure while loading any signed-in page. It renders inside the app shell,
// so the sidebar stays and the user can navigate elsewhere.
export default function AppError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="px-4 py-10 md:px-8 md:py-16">
      <ErrorState error={error} retry={retry} />
    </main>
  );
}
