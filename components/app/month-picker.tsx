import Link from "next/link";
import { formatMonth, shiftMonth } from "@/lib/expense-filters";
import { button, input } from "@/lib/ui";
import { MonthArrow } from "./month-arrow";
import { MonthInput } from "./month-input";

// Steps through months with arrows, or jumps to one with the month field. Months
// after `maxMonth` are not offered (the current month unless a page says otherwise;
// budgets can be planned ahead).
export function MonthPicker({
  basePath,
  month,
  currentMonth,
  maxMonth = currentMonth,
}: {
  basePath: string;
  month: string;
  currentMonth: string;
  maxMonth?: string;
}) {
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canGoNext = next <= maxMonth;

  return (
    <div
      data-testid="month-picker"
      // One row on a phone: previous, the month field (takes the spare width), next.
      className="flex w-full flex-wrap items-center gap-2 sm:w-auto"
    >
      <MonthArrow
        direction="prev"
        href={`${basePath}?month=${previous}`}
        label={`Previous month: ${formatMonth(previous)}`}
      />

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
          max={maxMonth}
          className={`${input} mt-0 min-w-0 flex-1 sm:w-44 sm:flex-none`}
        />
        {/* Hidden on a phone to leave the month field room: picking a month there
            applies it (see month-input.tsx). Still in the page for everyone else. */}
        <button type="submit" data-show-month className={`${button("secondary")} max-sm:hidden`}>
          Show
        </button>
      </form>

      <MonthArrow
        direction="next"
        href={canGoNext ? `${basePath}?month=${next}` : null}
        label={`Next month: ${formatMonth(next)}`}
      />

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
