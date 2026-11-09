import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Repeat } from "lucide-react";
import { RecurringActions } from "@/components/app/recurring-actions";
import { RecurringForm } from "@/components/app/recurring-form";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { ensureDefaultCategories } from "@/lib/categories";
import { db } from "@/lib/db";
import { currentMonth, shiftMonth } from "@/lib/expense-filters";
import { formatDay } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { nextDueDate } from "@/lib/recurring";
import { generateDueExpenses, listRecurring } from "@/lib/recurring-db";
import { card, iconChip } from "@/lib/ui";

export const metadata = {
  title: "Recurring | Expense Tracker",
};

export default function RecurringPage() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title="Recurring expenses"
          description="Rent, subscriptions and anything else that repeats. An expense is added on its day every month."
        />
        <Suspense
          fallback={
            <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
              <Skeleton className="h-[480px] rounded-2xl" />
              <Skeleton className="h-[480px] rounded-2xl" />
            </div>
          }
        >
          <RecurringContent />
        </Suspense>
      </div>
    </main>
  );
}

// Session and data are read at request time, scoped to the signed-in user.
async function RecurringContent() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/recurring");
  const userId = session.user.id;

  await ensureDefaultCategories(userId);
  await generateDueExpenses(userId);
  const month = currentMonth();
  const [categories, items] = await Promise.all([
    db.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    listRecurring(userId),
  ]);

  return (
    <div className="grid items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
      <section className={`${card} p-6`} aria-labelledby="add-recurring">
        <h2
          id="add-recurring"
          className="mb-4 text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Add a recurring expense
        </h2>
        <RecurringForm
          categories={categories}
          month={month}
          minMonth={shiftMonth(month, -12)}
        />
      </section>

      <section
        className={`${card} overflow-hidden`}
        aria-labelledby="recurring-list"
        data-testid="recurring-list"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-5">
          <h2
            id="recurring-list"
            className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            Your recurring expenses
          </h2>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className={`${iconChip} size-11`}>
              <Repeat className="size-5" aria-hidden="true" />
            </span>
            <p className="max-w-xs text-sm text-zinc-600 dark:text-zinc-400" data-testid="recurring-empty">
              Nothing recurring yet. Add your rent or a subscription and it will be
              added to your expenses every month.
            </p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-900">
            {items.map((item) => {
              const name = item.note || item.categoryName;
              return (
                <li
                  key={item.id}
                  data-testid="recurring-item"
                  data-active={item.active}
                  className={`flex flex-col gap-3 px-5 py-4 ${item.active ? "" : "opacity-70"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {name}
                      </p>
                      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                        {item.categoryName} · day {item.dayOfMonth} of every month
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                      {formatPaise(item.amount)}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-zinc-600 dark:text-zinc-400" data-testid="recurring-status">
                      {item.active ? (
                        <>
                          Next:{" "}
                          {formatDay(
                            new Date(`${nextDueDate(item)}T00:00:00.000Z`),
                          )}
                        </>
                      ) : (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                          Paused
                        </span>
                      )}
                    </p>
                    <RecurringActions id={item.id} active={item.active} name={name} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
