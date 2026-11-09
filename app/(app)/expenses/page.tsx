import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Plus, SearchX } from "lucide-react";
import { auth } from "@/lib/auth";
import { DeleteExpenseButton } from "@/components/app/delete-expense-button";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/db";
import { formatMonth, resolveMonth } from "@/lib/expense-filters";
import { EXPENSE_LIST_LIMIT, listExpenses } from "@/lib/expenses";
import { formatDay } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import { button, card, iconChip, input, label } from "@/lib/ui";

export const metadata = {
  title: "Expenses | Expense Tracker",
};

type SearchParams = Promise<{
  month?: string | string[];
  category?: string | string[];
}>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// What the delete dialog shows, so the user can see exactly what will go.
function describe(expense: {
  amount: number;
  date: Date;
  note: string | null;
  categoryName: string;
}): string {
  const parts = [
    formatPaise(expense.amount),
    expense.categoryName,
    formatDay(expense.date),
  ];
  if (expense.note) parts.push(`"${expense.note}"`);
  return parts.join(" · ");
}

const editLink =
  "rounded-md px-2 py-1 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50";

export default function ExpensesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title="Expenses"
          description="Every expense, filtered by month and category."
          actions={
            <Link href="/expenses/new" className={button("primary")}>
              <Plus className="size-4" aria-hidden="true" />
              Add expense
            </Link>
          }
        />
        <Suspense
          fallback={
            <div className="flex flex-col gap-4">
              <Skeleton className="h-[92px] rounded-2xl" />
              <Skeleton className="h-[480px] rounded-2xl" />
            </div>
          }
        >
          <ExpensesContent searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

// Session, filters and data are read at request time and scoped to the user.
async function ExpensesContent({ searchParams }: { searchParams: SearchParams }) {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/expenses");
  const userId = session.user.id;

  const params = await searchParams;
  const month = resolveMonth(first(params.month));

  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  // Only the user's own categories are accepted. Anything else is ignored.
  const requestedCategory = first(params.category);
  const categoryId =
    categories.find((category) => category.id === requestedCategory)?.id ?? null;

  const { items, totalPaise, count, truncated } = await listExpenses({
    userId,
    month,
    categoryId,
  });

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <form
        method="get"
        action="/expenses"
        className={`${card} grid grid-cols-2 items-end gap-x-3 gap-y-3 p-4 sm:grid-cols-[1fr_1fr_auto]`}
      >
        <div>
          <label htmlFor="month" className={label}>
            Month
          </label>
          <input
            id="month"
            name="month"
            type="month"
            placeholder="YYYY-MM"
            pattern="\d{4}-\d{2}"
            title="Use the format YYYY-MM, for example 2026-11"
            defaultValue={month ?? ""}
            className={input}
          />
        </div>
        <div>
          <label htmlFor="category" className={label}>
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categoryId ?? ""}
            className={input}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2 flex gap-2 sm:col-span-1">
          <button type="submit" className={`${button("primary")} flex-1 sm:flex-none`}>
            Apply
          </button>
          <Link href="/expenses" className={button("secondary")}>
            Reset
          </Link>
        </div>
        <p className="col-span-2 text-xs text-zinc-500 sm:col-span-3 dark:text-zinc-400">
          Clear the month and apply to see all months.
        </p>
      </form>

      <section className={`${card} overflow-hidden`}>
        <div className="flex items-baseline justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {count} {count === 1 ? "expense" : "expenses"}
          </p>
          <p
            data-testid="total"
            className="text-xl font-semibold tracking-tight tabular-nums text-zinc-950 dark:text-zinc-50"
          >
            {formatPaise(totalPaise)}
          </p>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <span className={`${iconChip} size-11`}>
              <SearchX className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {categoryId
                ? "No expenses match these filters."
                : month
                  ? `No expenses in ${formatMonth(month)} yet.`
                  : "You have not added any expenses yet."}
            </p>
            <Link href="/expenses/new" className={button("primary", "sm")}>
              Add an expense
            </Link>
          </div>
        ) : (
          <>
            <table className="hidden w-full text-sm md:table">
              <thead>
                <tr className="border-b border-zinc-100 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-900">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Note</th>
                  <th className="px-5 py-3 text-right font-medium">Amount</th>
                  <th className="px-5 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {items.map((expense) => (
                  <tr
                    key={expense.id}
                    data-testid="expense-row"
                    className="transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                      {formatDay(expense.date)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                        {expense.categoryName}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                      {expense.note ?? ""}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                      {formatPaise(expense.amount)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/expenses/${expense.id}/edit`}
                          className={editLink}
                        >
                          Edit
                        </Link>
                        <DeleteExpenseButton
                          id={expense.id}
                          summary={describe(expense)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <ul className="divide-y divide-zinc-100 md:hidden dark:divide-zinc-900">
              {items.map((expense) => (
                <li key={expense.id} className="flex flex-col gap-1 px-4 py-3.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                      {expense.categoryName}
                    </span>
                    <span className="text-base font-semibold tabular-nums">
                      {formatPaise(expense.amount)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="truncate">{expense.note ?? ""}</span>
                    <span className="shrink-0">{formatDay(expense.date)}</span>
                  </div>
                  <div className="flex items-center gap-1 pt-1">
                    <Link
                      href={`/expenses/${expense.id}/edit`}
                      className={editLink}
                    >
                      Edit
                    </Link>
                    <DeleteExpenseButton
                      id={expense.id}
                      summary={describe(expense)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {truncated ? (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Showing the latest {EXPENSE_LIST_LIMIT} of {count} expenses. Narrow the
          filters to see the rest.
        </p>
      ) : null}
    </div>
  );
}
