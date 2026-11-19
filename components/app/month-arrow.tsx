import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

const arrow =
  "inline-flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f766e]/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 lg:size-9";

// A previous/next month button. With no `href` (nothing further to show) it is a
// dimmed, non-interactive placeholder that keeps the row from shifting.
export function MonthArrow({
  direction,
  href,
  label,
}: {
  direction: "prev" | "next";
  href: string | null;
  label: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  if (href === null) {
    return (
      <span
        aria-hidden="true"
        data-testid={`month-${direction}-disabled`}
        className={`${arrow} cursor-not-allowed opacity-40`}
      >
        <Icon className="size-4" />
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={label}
      data-testid={`month-${direction}`}
      className={arrow}
    >
      <Icon className="size-4" aria-hidden="true" />
    </Link>
  );
}
