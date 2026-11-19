import { isOverBudget, overBy, type BudgetLine } from "@/lib/budget";
import type { CategoryLooks } from "@/lib/category-style";
import type { CurrencyCode } from "@/lib/currency";
import { formatPaise } from "@/lib/money";
import { CategoryBadge } from "./category-badge";

// Green below 80%, amber from 80%, red at 100% or more. Colour is never the only
// signal: the text below the bar says the same thing, and the bar has a
// progressbar role for screen readers.
const FILL = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  limit: "bg-red-600",
} as const;

function detailText(
  line: BudgetLine & { budget: number },
  currency: CurrencyCode,
): string {
  if (isOverBudget(line.spent, line.budget)) {
    return `${formatPaise(overBy(line.spent, line.budget), currency)} over budget`;
  }
  if (line.status === "limit") return "Limit reached";

  // Rounded down, so 79.6% reads "79%" and cannot look like the 80% warning
  // while the bar is still green.
  const percent = Math.floor(line.percentUsed ?? 0);
  const left = `${formatPaise(line.remaining ?? 0, currency)} left`;
  return line.status === "warning"
    ? `${percent}% used · ${left} · Close to limit`
    : `${percent}% used · ${left}`;
}

export function BudgetProgress({
  label,
  line,
  currency,
  withBadge = false,
  looks,
}: {
  label: string;
  // Show the category's coloured icon beside the name (not for the overall budget).
  withBadge?: boolean;
  looks?: CategoryLooks;
  line: BudgetLine;
  currency: CurrencyCode;
}) {
  if (line.budget === null || line.status === "none") return null;
  const budgeted = { ...line, budget: line.budget };

  const width = Math.min(100, Math.max(0, line.percentUsed ?? 0));
  const detail = detailText(budgeted, currency);

  return (
    <div data-testid="budget-progress" data-status={line.status}>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 font-medium text-zinc-900 dark:text-zinc-100">
          {withBadge ? <CategoryBadge name={label} looks={looks} className="size-6" /> : null}
          <span className="truncate">{label}</span>
        </span>
        <span className="tabular-nums text-zinc-600 dark:text-zinc-400">
          {formatPaise(line.spent, currency)} of {formatPaise(line.budget, currency)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label={`${label} budget used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(width)}
        aria-valuetext={detail}
        className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          data-testid="budget-progress-fill"
          className={`h-full rounded-full ${FILL[line.status]}`}
          style={{ width: `${width.toFixed(2)}%` }}
        />
      </div>
      <p
        data-testid="budget-progress-detail"
        className="mt-1 text-xs text-zinc-600 dark:text-zinc-400"
      >
        {detail}
      </p>
    </div>
  );
}
