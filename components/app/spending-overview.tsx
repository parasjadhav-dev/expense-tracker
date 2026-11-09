import type { BudgetSummary, SafeToSpend as SafeToSpendResult } from "@/lib/budget";
import { formatMonth } from "@/lib/expense-filters";
import { formatPaise } from "@/lib/money";
import { card } from "@/lib/ui";
import { BudgetProgress } from "./budget-progress";
import { SafeToSpend } from "./safe-to-spend";

// Read-only view of one month: how much of each budget has been used, and how
// much can still be spent per day.
export function SpendingOverview({
  month,
  summary,
  safe,
}: {
  month: string;
  summary: BudgetSummary;
  safe: SafeToSpendResult;
}) {
  const withLimit = summary.categories.filter((c) => c.budget !== null);
  const withoutLimit = summary.categories.filter(
    (c) => c.budget === null && c.spent > 0,
  );
  const { overall } = summary;

  return (
    <section
      aria-labelledby="spending-overview"
      className={`${card} p-6`}
    >
      <h2
        id="spending-overview"
        className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
      >
        Spending vs budget for {formatMonth(month)}
      </h2>

      <div className="mt-4 flex flex-col gap-5">
        <SafeToSpend safe={safe} />

        {overall.budget !== null ? (
          <BudgetProgress label="Overall" line={overall} />
        ) : (
          <p
            data-testid="no-overall-budget"
            className="text-sm text-zinc-600 dark:text-zinc-400"
          >
            Spent {formatPaise(overall.spent)} this month. No overall budget is
            set.
          </p>
        )}

        {withLimit.length > 0 ? (
          withLimit.map((category) => (
            <BudgetProgress
              key={category.categoryId}
              label={category.name}
              line={category}
            />
          ))
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Set a limit for a category to track it here.
          </p>
        )}

        {withoutLimit.length > 0 ? (
          <div
            data-testid="without-limit"
            className="rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900"
          >
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              Spending without a limit
            </p>
            <ul className="mt-1.5 flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
              {withoutLimit.map((category) => (
                <li
                  key={category.categoryId}
                  className="flex justify-between gap-3"
                >
                  <span>{category.name}</span>
                  <span className="tabular-nums">
                    {formatPaise(category.spent)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}
