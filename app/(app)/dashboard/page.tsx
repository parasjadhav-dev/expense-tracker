import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { BudgetAlerts } from "@/components/app/budget-alerts";
import { MonthPicker } from "@/components/app/month-picker";
import { BudgetStatus } from "@/components/app/budget-status";
import { CategoryChart } from "@/components/app/category-chart";
import { RecentExpenses } from "@/components/app/recent-expenses";
import { SummaryCards } from "@/components/app/summary-cards";
import { TrendChart } from "@/components/app/trend-chart";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { daysLeftInMonth, safeToSpend } from "@/lib/budget";
import { loadMonthBudgets } from "@/lib/budget-summary";
import { buildCategoryBreakdown } from "@/lib/category-breakdown";
import { currentMonth, formatMonth, resolveMonth } from "@/lib/expense-filters";
import { getRecentExpenses, getSpendingByDay } from "@/lib/expenses";
import { buildMonthlyTrend, lastMonths } from "@/lib/monthly-trend";
import { todayInAppZone } from "@/lib/time";
import { button, card } from "@/lib/ui";

export const metadata = {
  title: "Dashboard | Expense Tracker",
};

const addExpenseAction = (
  <Link href="/expenses/new" className={button("primary")}>
    <Plus className="size-4" aria-hidden="true" />
    Add expense
  </Link>
);

type SearchParams = Promise<{ month?: string | string[] }>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

// Holds the shape of the page while the real content streams in, so there is no
// blank gap.
function DashboardSkeleton() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description={<Skeleton className="mt-1 h-4 w-64" />}
        actions={addExpenseAction}
      />
      <div className="flex flex-col gap-4 md:gap-5">
        <div className="grid gap-4 sm:grid-cols-3 md:gap-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <Skeleton className="h-[340px] rounded-2xl" />
          <Skeleton className="h-[340px] rounded-2xl" />
        </div>
        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <Skeleton className="h-[300px] rounded-2xl" />
          <Skeleton className="h-[300px] rounded-2xl" />
        </div>
      </div>
    </>
  );
}

// Request-time session check on the server. It does not rely on proxy.ts alone.
async function DashboardContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/dashboard");
  }
  const userId = session.user.id;

  // The current month in the app time zone, so the numbers match what the user
  // sees on the calendar.
  const today = todayInAppZone();
  const nowMonth = currentMonth();
  // ?month=YYYY-MM shows an earlier month. Missing, empty, invalid and future
  // months all fall back to the current one.
  const requested = resolveMonth(first((await searchParams).month)) ?? nowMonth;
  const month = requested > nowMonth ? nowMonth : requested;
  const isCurrentMonth = month === nowMonth;
  const [{ summary }, dailyTotals, recent] = await Promise.all([
    loadMonthBudgets(userId, month),
    // The six months ending with the current one.
    getSpendingByDay(userId, lastMonths(month)[0], month),
    getRecentExpenses(userId, { limit: 6, month }),
  ]);
  const trend = buildMonthlyTrend({
    endMonth: month,
    inProgressMonth: nowMonth,
    dailyTotals,
  });
  const safe = safeToSpend({
    budget: summary.overall.budget,
    spent: summary.overall.spent,
    daysLeft: daysLeftInMonth(month, today),
  });
  const breakdown = buildCategoryBreakdown(
    summary.categories.map((category) => ({
      id: category.categoryId,
      name: category.name,
      spent: category.spent,
    })),
  );

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          <>
            Welcome, {session.user.name ?? session.user.email}. Here is{" "}
            {formatMonth(month)}
            {isCurrentMonth ? " so far." : "."}
          </>
        }
        actions={
          <>
            <MonthPicker
              basePath="/dashboard"
              month={month}
              currentMonth={nowMonth}
            />
            {addExpenseAction}
          </>
        }
      />

      <div className="flex flex-col gap-4 md:gap-5">
        <BudgetAlerts month={month} summary={summary} showManageLink />
        <SummaryCards
          month={month}
          isCurrentMonth={isCurrentMonth}
          overall={summary.overall}
          safe={safe}
        />

        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <section
            aria-labelledby="category-chart"
            className={`${card} flex flex-col p-5`}
          >
            <h2
              id="category-chart"
              className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              Spending by category
            </h2>
            <p className="mt-0.5 mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              {formatMonth(month)}
            </p>
            {breakdown.rows.length > 0 ? (
              <CategoryChart monthLabel={formatMonth(month)} breakdown={breakdown} />
            ) : (
              <p
                data-testid="chart-empty"
                className="flex flex-1 items-center justify-center py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
              >
                No spending recorded for {formatMonth(month)} yet.
              </p>
            )}
          </section>

          <section
            aria-labelledby="trend-chart"
            className={`${card} flex flex-col p-5`}
          >
            <h2
              id="trend-chart"
              className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              Monthly spending
            </h2>
            <p className="mt-0.5 mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              Last {trend.points.length} months
            </p>
            {trend.empty ? (
              <p
                data-testid="trend-empty"
                className="flex flex-1 items-center justify-center py-10 text-center text-sm text-zinc-600 dark:text-zinc-400"
              >
                No spending in the last {trend.points.length} months yet.
              </p>
            ) : (
              <TrendChart trend={trend} />
            )}
          </section>
        </div>

        <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
          <RecentExpenses
            id="recent-expenses"
            title={isCurrentMonth ? "Recent expenses" : `Expenses in ${formatMonth(month)}`}
            items={recent}
            emptyText={
              isCurrentMonth
                ? "No expenses yet. Add your first one to start tracking."
                : `No expenses recorded in ${formatMonth(month)}.`
            }
            footerHref={`/expenses?month=${month}`}
            footerLabel="View all"
          />
          <BudgetStatus month={month} summary={summary} />
        </div>
      </div>
    </>
  );
}
