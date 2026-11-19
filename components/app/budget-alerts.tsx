import Link from "next/link";
import { ArrowRight, CircleAlert, TriangleAlert } from "lucide-react";
import {
  budgetAlerts,
  type BudgetAlert,
  type BudgetSummary,
} from "@/lib/budget";
import { formatMonth } from "@/lib/expense-filters";
import type { CurrencyCode } from "@/lib/currency";
import { formatPaise } from "@/lib/money";
import { tapTarget } from "@/lib/ui";

const STYLE = {
  over: "bg-red-50 text-red-900 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-900",
  reached:
    "bg-red-50 text-red-900 ring-red-200 dark:bg-red-950 dark:text-red-100 dark:ring-red-900",
  warning:
    "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900",
} as const;

function message(alert: BudgetAlert, currency: CurrencyCode): string {
  const amounts = `${formatPaise(alert.spent, currency)} of ${formatPaise(alert.budget, currency)}`;
  const who = alert.scope === "overall" ? "your overall budget" : "its budget";
  // Rounded down so the percent never reaches 80 before the warning does.
  const percent = Math.floor(alert.percentUsed);

  switch (alert.kind) {
    case "over":
      return alert.scope === "overall"
        ? `You are over your overall budget by ${formatPaise(alert.overBy, currency)} (${amounts}).`
        : `${alert.name} is over budget by ${formatPaise(alert.overBy, currency)} (${amounts}).`;
    case "reached":
      return alert.scope === "overall"
        ? `You have used all of your overall budget (${formatPaise(alert.budget, currency)}).`
        : `${alert.name} has used all of its budget (${formatPaise(alert.budget, currency)}).`;
    case "warning":
      return alert.scope === "overall"
        ? `You have used ${percent}% of ${who} (${amounts}).`
        : `${alert.name} is at ${percent}% of ${who} (${amounts}).`;
  }
}

// Banners for budgets that are at or past the warning threshold. Renders
// nothing when every budget is comfortably within its limit. Colour is never
// the only signal: each banner has an icon and says what is wrong in words.
export function BudgetAlerts({
  month,
  summary,
  currency,
  showManageLink = false,
}: {
  month: string;
  summary: BudgetSummary;
  currency: CurrencyCode;
  showManageLink?: boolean;
}) {
  const alerts = budgetAlerts(summary);
  if (alerts.length === 0) return null;

  return (
    <section
      aria-label={`Budget alerts for ${formatMonth(month)}`}
      data-testid="budget-alerts"
      className="flex flex-col gap-2"
    >
      {alerts.map((alert) => {
        const serious = alert.kind !== "warning";
        const Icon = serious ? CircleAlert : TriangleAlert;
        return (
          <div
            key={alert.categoryId ?? "overall"}
            role={serious ? "alert" : "status"}
            data-testid="budget-alert"
            data-kind={alert.kind}
            className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm ring-1 ${STYLE[alert.kind]}`}
          >
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{message(alert, currency)}</p>
          </div>
        );
      })}
      {showManageLink ? (
        <Link
          href={`/budgets?month=${month}`}
          className={`${tapTarget} inline-flex items-center gap-1 self-end text-sm font-medium text-[#0f766e] hover:underline dark:text-[#5eead4]`}
        >
          Manage budgets
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}
