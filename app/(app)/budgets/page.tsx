import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { BudgetForm } from "@/components/app/budget-form";
import { CategoryBudgetsForm } from "@/components/app/category-budgets-form";
import { BudgetAlerts } from "@/components/app/budget-alerts";
import { SpendingOverview } from "@/components/app/spending-overview";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { generateDueExpenses } from "@/lib/recurring-db";
import { checkBudgetMonth } from "@/lib/validations/budget";
import { daysLeftInMonth, safeToSpend } from "@/lib/budget";
import { loadMonthBudgets } from "@/lib/budget-summary";
import { ensureDefaultCategories } from "@/lib/categories";
import { currentMonth, formatMonth, resolveMonth } from "@/lib/expense-filters";
import { formatPaise, paiseToRupeesInput } from "@/lib/money";
import { todayInAppZone } from "@/lib/time";
import { button, card, input } from "@/lib/ui";

export const metadata = {
  title: "Budgets | Expense Tracker",
};

type SearchParams = Promise<{ month?: string | string[] }>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

const GRID = "grid items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_26rem]";

export default function BudgetsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <Suspense
          fallback={
            <>
              <PageHeader
                title="Budgets"
                description="Set how much you plan to spend each month."
              />
              <div className={GRID}>
                <Skeleton className="h-[520px] rounded-2xl" />
                <Skeleton className="h-[520px] rounded-2xl" />
              </div>
            </>
          }
        >
          <BudgetsContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

// Session and data are read at request time and scoped to the signed-in user.
async function BudgetsContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/budgets");
  const userId = session.user.id;
  // Adds any recurring expenses that have come due since the last visit.
  await generateDueExpenses(userId);

  const params = await searchParams;
  // No month, an empty one, or an invalid one all mean the current month.
  const requested = resolveMonth(first(params.month)) ?? currentMonth();
  // A month too far ahead could never be saved to, so it is not offered.
  const month = checkBudgetMonth(requested) === null ? requested : currentMonth();
  await ensureDefaultCategories(userId);
  const {
    overallBudget: budget,
    categories,
    categoryBudgets,
    summary,
  } = await loadMonthBudgets(userId, month);
  // "Today" follows the app time zone (lib/time.ts), counted into the days left.
  const safe = safeToSpend({
    budget: summary.overall.budget,
    spent: summary.overall.spent,
    daysLeft: daysLeftInMonth(month, todayInAppZone()),
  });
  const categoryTotal = Object.values(categoryBudgets).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  const overBy = budget ? categoryTotal - budget.amount : 0;

  return (
    <>
      <PageHeader
        title="Budgets"
        description="Set how much you plan to spend each month."
        actions={
          <form method="get" action="/budgets" className="flex items-center gap-2">
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
              className={`${input} mt-0 w-44`}
            />
            <button type="submit" className={button("secondary")}>
              Show
            </button>
          </form>
        }
      />

      <div className={GRID}>
        <div className="flex flex-col gap-4 md:gap-5">
          <BudgetAlerts month={month} summary={summary} />
          <SpendingOverview month={month} summary={summary} safe={safe} />
        </div>

        <div className="flex flex-col gap-4 md:gap-5">
          <section aria-labelledby="overall-budget" className={`${card} p-6`}>
            <h2
              id="overall-budget"
              className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              Overall budget for {formatMonth(month)}
            </h2>
            <p
              data-testid="current-budget"
              className="mt-2 mb-5 text-3xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-zinc-50"
            >
              {budget ? formatPaise(budget.amount) : "Not set"}
            </p>
            <BudgetForm
              month={month}
              initialAmount={budget ? paiseToRupeesInput(budget.amount) : undefined}
            />
          </section>

          <section aria-labelledby="category-budgets" className={`${card} p-6`}>
            <h2
              id="category-budgets"
              className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              Category budgets for {formatMonth(month)}
            </h2>
            <p
              data-testid="category-total"
              className="mt-2 mb-5 text-sm text-zinc-600 dark:text-zinc-400"
            >
              {categoryTotal > 0
                ? `Saved category limits add up to ${formatPaise(categoryTotal)}.`
                : "No category limits set."}
              {overBy > 0 ? (
                <span
                  data-testid="over-overall"
                  className="mt-1 block text-amber-700 dark:text-amber-400"
                >
                  That is {formatPaise(overBy)} more than your overall budget.
                </span>
              ) : null}
            </p>
            <CategoryBudgetsForm
              month={month}
              rows={categories.map((category) => ({
                id: category.id,
                name: category.name,
                amount:
                  category.id in categoryBudgets
                    ? paiseToRupeesInput(categoryBudgets[category.id])
                    : undefined,
              }))}
            />
          </section>
        </div>
      </div>
    </>
  );
}
