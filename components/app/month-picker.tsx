import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonth, shiftMonth } from "@/lib/expense-filters";
import { button, input } from "@/lib/ui";
import { MonthInput } from "./month-input";

const arrow =
  "inline-flex size-11 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 lg:size-9";

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
      // One row on a phone: previous, the month field (takes the spare width), next.
      className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
    >
      <Link
        href={`${basePath}?month=${previous}`}
        aria-label={`Previous month: ${formatMonth(previous)}`}
        data-testid="month-prev"
        className={arrow}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Link>

      <form
        method="get"
        action={basePath}
        className="flex min-w-[10rem] flex-1 items-center gap-2 sm:min-w-0 sm:flex-none"
      >
        <label htmlFor="month" className="sr-only">
          Month
        </label>
        <MonthInput
          id="month"
          name="month"
          type="month"
          placeholder="YYYY-MM"
          pattern="\d{4}-\d{2}"
          title="Use the format YYYY-MM, for example 2026-11"
          defaultValue={month}
          max={currentMonth}
          className={`${input} mt-0 min-w-0 flex-1 sm:w-44 sm:flex-none`}
        />
        {/* Hidden on a phone to leave the month field room: picking a month there
            applies it (see month-input.tsx). Still in the page for everyone else. */}
        <button type="submit" data-show-month className={`${button("secondary")} max-sm:hidden`}>
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
