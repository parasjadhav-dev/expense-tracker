import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth, shiftMonth } from "@/lib/expense-filters";
import { button, input } from "@/lib/ui";

const arrow =
  "inline-flex size-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

// Steps through months with arrows, or jumps to one with the month field. Months
// after the current one are not offered: there is nothing to show yet.
export function MonthPicker({
  basePath,
  month,
  currentMonth,
}: {
  basePath: string;
  month: string;
  currentMonth: string;
}) {
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canGoNext = next <= currentMonth;

  return (
    <div
      data-testid="month-picker"
      className="flex flex-wrap items-center gap-2"
    >
      <Link
        href={`${basePath}?month=${previous}`}
        aria-label={`Previous month: ${formatMonth(previous)}`}
        data-testid="month-prev"
        className={arrow}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Link>

      <form method="get" action={basePath} className="flex items-center gap-2">
        <label htmlFor="month" className="sr-only">
          Month
        </label>
        <input
          id="month"
          name="month"
          type="month"
          placeholder="YYYY-MM"
          pattern="\d{4}-\d{2}"
          title="Use the format YYYY-MM, for example 2026-11"
          defaultValue={month}
          max={currentMonth}
          className={`${input} mt-0 w-44`}
        />
        <button type="submit" className={button("secondary")}>
          Show
        </button>
      </form>

      {canGoNext ? (
        <Link
          href={`${basePath}?month=${next}`}
          aria-label={`Next month: ${formatMonth(next)}`}
          data-testid="month-next"
          className={arrow}
        >
          <ChevronRight className="size-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-hidden="true"
          data-testid="month-next-disabled"
          className={`${arrow} cursor-not-allowed opacity-40`}
        >
          <ChevronRight className="size-4" />
        </span>
      )}

      {month !== currentMonth ? (
        <Link
          href={basePath}
          data-testid="month-current"
          className={button("secondary")}
        >
          This month
        </Link>
      ) : null}
    </div>
  );
}
