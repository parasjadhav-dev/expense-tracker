import Link from "next/link";
import { ArrowRight, Target } from "lucide-react";
import type { BudgetSummary } from "@/lib/budget";
import type { CurrencyCode } from "@/lib/currency";
import { formatMonth } from "@/lib/expense-filters";
import { EmptyState } from "@/components/ui/empty-state";
import { button, card, tapTarget } from "@/lib/ui";
import { BudgetProgress } from "./budget-progress";

const MAX_ROWS = 5;
const PHONE_ROWS = 3;

// The categories closest to their limits, as progress bars: the dashboard's
// quick answer to "how am I doing against my budgets?".
export function BudgetStatus({
  month,
  summary,
  currency,
}: {
  month: string;
  summary: BudgetSummary;
  currency: CurrencyCode;
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
          className={`${tapTarget} inline-flex items-center gap-1 text-sm font-medium text-[#0f766e] hover:underline dark:text-[#5eead4]`}
        >
          Manage
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        {formatMonth(month)}, closest to the limit first
      </p>

      {withLimit.length === 0 ? (
        <EmptyState
          icon={Target}
          action={
            <Link href={`/budgets?month=${month}`} className={button("primary", "sm")}>
              Set category budgets
            </Link>
          }
        >
          Set a limit for a category to see how close you are to it.
        </EmptyState>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {withLimit.map((category, index) => (
            // A phone shows the three closest to their limit; "Manage" has the rest.
            <div key={category.categoryId} className={index >= PHONE_ROWS ? "max-sm:hidden" : ""}>
              <BudgetProgress label={category.name} line={category} currency={currency} withBadge />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
