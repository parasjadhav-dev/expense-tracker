import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import type { BudgetSummary } from "@/lib/budget";
import { formatMonth } from "@/lib/expense-filters";
import { button, card, iconChip } from "@/lib/ui";
import { BudgetProgress } from "./budget-progress";

const MAX_ROWS = 5;

// The categories closest to their limits, as progress bars: the dashboard's
// quick answer to "how am I doing against my budgets?".
export function BudgetStatus({
  month,
  summary,
}: {
  month: string;
  summary: BudgetSummary;
}) {
  const withLimit = summary.categories
    .filter((category) => category.budget !== null)
    .sort((a, b) => (b.percentUsed ?? 0) - (a.percentUsed ?? 0))
    .slice(0, MAX_ROWS);

  return (
    <section
      aria-labelledby="budget-status"
      data-testid="budget-status"
      className={`${card} flex flex-col p-5`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id="budget-status"
          className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Budget status
        </h2>
        <Link
          href={`/budgets?month=${month}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-[#1c5cab] hover:underline dark:text-[#6da7ec]"
        >
          Manage
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {formatMonth(month)}, closest to the limit first
      </p>

      {withLimit.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <span className={`${iconChip} size-11`}>
            <Target className="size-5" aria-hidden="true" />
          </span>
          <p className="max-w-[16rem] text-sm text-zinc-600 dark:text-zinc-400">
            Set a limit for a category to see how close you are to it.
          </p>
          <Link href={`/budgets?month=${month}`} className={button("primary", "sm")}>
            Set category budgets
          </Link>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {withLimit.map((category) => (
            <BudgetProgress
              key={category.categoryId}
              label={category.name}
              line={category}
            />
          ))}
        </div>
      )}
    </section>
  );
}
