import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { DeleteExpenseButton } from "@/components/app/delete-expense-button";
import { db } from "@/lib/db";
import { resolveMonth } from "@/lib/expense-filters";
import { EXPENSE_LIST_LIMIT, listExpenses } from "@/lib/expenses";
import { formatPaise } from "@/lib/money";

export const metadata = {
  title: "Expenses | Expense Tracker",
};

type SearchParams = Promise<{
  month?: string | string[];
  category?: string | string[];
}>;

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC", // dates are stored as UTC-midnight calendar dates
});

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
    dateFormat.format(expense.date),
  ];
  if (expense.note) parts.push(`"${expense.note}"`);
  return parts.join(" · ");
}

export default function ExpensesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Expenses
          </h1>
          <Link
            href="/expenses/new"
            className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
          >
            Add expense
          </Link>
        </div>
        <Suspense
          fallback={<p className="text-sm text-zinc-500">Loading expenses...</p>}
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
    <div className="flex flex-col gap-4">
      <form
        method="get"
        action="/expenses"
        className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-end dark:bg-zinc-950 dark:ring-1 dark:ring-white/10"
      >
        <div className="flex-1">
          <label htmlFor="month" className="text-sm font-medium">
            Month
          </label>
          <input
            id="month"
            name="month"
            type="month"
            defaultValue={month ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <div className="flex-1">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category"
            name="category"
            defaultValue={categoryId ?? ""}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="h-10 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
          >
            Apply
          </button>
          <Link
            href="/expenses"
            className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Reset
          </Link>
        </div>
      </form>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Clear the month and apply to see all months.
      </p>

      <div className="flex items-baseline justify-between rounded-xl bg-white px-4 py-3 shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {count} {count === 1 ? "expense" : "expenses"}
        </p>
        <p
          data-testid="total"
          className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50"
        >
          {formatPaise(totalPaise)}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-zinc-600 shadow-sm dark:bg-zinc-950 dark:text-zinc-400 dark:ring-1 dark:ring-white/10">
          No expenses match these filters.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl bg-white shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10">
          <table className="hidden w-full text-sm md:table">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Note</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
              {items.map((expense) => (
                <tr key={expense.id} data-testid="expense-row">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {dateFormat.format(expense.date)}
                  </td>
                  <td className="px-4 py-3 font-medium">{expense.categoryName}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {expense.note ?? ""}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums">
                    {formatPaise(expense.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <Link
                        href={`/expenses/${expense.id}/edit`}
                        className="text-sm font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
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
              <li key={expense.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{expense.categoryName}</span>
                  <span className="font-medium tabular-nums">
                    {formatPaise(expense.amount)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="truncate">{expense.note ?? ""}</span>
                  <span className="shrink-0">{dateFormat.format(expense.date)}</span>
                </div>
                <div className="flex items-center gap-4 pt-1">
                  <Link
                    href={`/expenses/${expense.id}/edit`}
                    className="text-sm font-medium text-zinc-950 underline underline-offset-4 dark:text-zinc-50"
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
        </div>
      )}

      {truncated ? (
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
          Showing the latest {EXPENSE_LIST_LIMIT} of {count} expenses. Narrow the
          filters to see the rest.
        </p>
      ) : null}
    </div>
  );
}
