import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ChevronLeft, ChevronRight, Pencil, Plus, ReceiptText, Search, SearchX, Upload } from "lucide-react";
import { auth } from "@/lib/auth";
import { generateDueExpenses } from "@/lib/recurring-db";
import { CategoryPill } from "@/components/app/category-badge";
import { DeleteExpenseButton } from "@/components/app/delete-expense-button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserCurrency } from "@/lib/currency-db";
import { db } from "@/lib/db";
import { looksByName } from "@/lib/category-style";
import { currentMonth, formatMonth, resolveMonth, shiftMonth } from "@/lib/expense-filters";
import { MonthArrow } from "@/components/app/month-arrow";
import {
  PAGE_SIZE,
  SORT_KEYS,
  SORT_LABELS,
  expensesHref,
  parsePage,
  parseSearch,
  parseSort,
} from "@/lib/expense-query";
import { listExpenses } from "@/lib/expenses";
import { formatDay } from "@/lib/format";
import type { CurrencyCode } from "@/lib/currency";
import { formatPaise } from "@/lib/money";
import { button, card, input, label } from "@/lib/ui";

export const metadata = {
  title: "Expenses | Expense Tracker",
};

type SearchParams = Promise<{
  month?: string | string[];
  category?: string | string[];
  q?: string | string[];
  sort?: string | string[];
  page?: string | string[];
}>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// What the delete dialog shows, so the user can see exactly what will go.
function describe(
  expense: {
    amount: number;
    date: Date;
    note: string | null;
    categoryName: string;
  },
  currency: CurrencyCode,
): string {
  const parts = [
    formatPaise(expense.amount, currency),
    expense.categoryName,
    formatDay(expense.date),
  ];
  if (expense.note) parts.push(`"${expense.note}"`);
  return parts.join(" · ");
}

const editLink =
  "inline-flex min-h-11 items-center rounded-md px-3 text-sm lg:min-h-0 lg:px-2 lg:py-1 font-medium text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:hover:text-zinc-50";

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
          description="Every expense. Search, filter by month and category, and sort."
          actions={
            <>
              <Link href="/expenses/import" className={button("secondary")}>
                <Upload className="size-4" aria-hidden="true" />
                Import CSV
              </Link>
              <Link href="/expenses/new" className={`${button("primary")} max-md:hidden`}>
                <Plus className="size-4" aria-hidden="true" />
                Add expense
              </Link>
            </>
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
  const currency = await getUserCurrency(userId);
  // Adds any recurring expenses that have come due since the last visit.
  await generateDueExpenses(userId);

  const params = await searchParams;
  const month = resolveMonth(first(params.month));

  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, color: true, icon: true },
  });
  const looks = looksByName(categories);
  // Only the user's own categories are accepted. Anything else is ignored.
  const requestedCategory = first(params.category);
  const categoryId =
    categories.find((category) => category.id === requestedCategory)?.id ?? null;

  const q = parseSearch(first(params.q));
  const sort = parseSort(first(params.sort));

  const { items, totalPaise, count, page, pageCount } = await listExpenses({
    userId,
    month,
    categoryId,
    q,
    sort,
    page: parsePage(first(params.page)),
  });
  const filtered = Boolean(q || categoryId);
  const firstShown = (page - 1) * PAGE_SIZE + 1;
  const lastShown = firstShown + items.length - 1;
  const hrefFor = (target: number) =>
    expensesHref({ month, categoryId, q, sort, page: target });

  // Arrows step one month at a time and keep the search, category and sort.
  const nowMonth = currentMonth();
  const previousMonth = month ? shiftMonth(month, -1) : null;
  const nextMonth = month ? shiftMonth(month, 1) : null;
  const monthHref = (target: string) =>
    expensesHref({ month: target, categoryId, q, sort, page: 1 });

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <div
        data-testid="month-stepper"
        className="flex items-center justify-between gap-2"
      >
        <MonthArrow
          direction="prev"
          href={previousMonth ? monthHref(previousMonth) : null}
          label={previousMonth ? `Previous month: ${formatMonth(previousMonth)}` : "Previous month"}
        />
        <div className="flex min-w-0 flex-1 flex-col items-center text-center">
          <p
            aria-live="polite"
            className="truncate text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
          >
            {month ? formatMonth(month) : "All months"}
          </p>
          {month !== nowMonth ? (
            <Link
              href={monthHref(nowMonth)}
              data-testid="month-current"
              className="-my-2 py-2 text-xs font-medium text-[#0f766e] underline-offset-4 hover:underline dark:text-[#5eead4]"
            >
              Go to this month
            </Link>
          ) : null}
        </div>
        <MonthArrow
          direction="next"
          href={nextMonth && nextMonth <= nowMonth ? monthHref(nextMonth) : null}
          label={nextMonth ? `Next month: ${formatMonth(nextMonth)}` : "Next month"}
        />
      </div>

      <form
        method="get"
        action="/expenses"
        role="search"
        className={`${card} grid grid-cols-1 items-end gap-x-3 gap-y-3 p-4 sm:grid-cols-6`}
      >
        <div className="sm:col-span-6">
          <label htmlFor="q" className={label}>
            Search
          </label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 mt-[3px] size-4 -translate-y-1/2 text-zinc-400"
              aria-hidden="true"
            />
            <input
              id="q"
              name="q"
              type="search"
              maxLength={80}
              placeholder="Note, category or exact amount"
              defaultValue={q}
              autoComplete="off"
              className={`${input} pl-9`}
            />
          </div>
        </div>
        <div className="sm:col-span-2">
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
        <div className="sm:col-span-2">
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
        <div className="sm:col-span-2">
          <label htmlFor="sort" className={label}>
            Sort by
          </label>
          <select id="sort" name="sort" defaultValue={sort} className={input}>
            {SORT_KEYS.map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 sm:col-span-6">
          <button type="submit" className={`${button("primary")} flex-1 sm:flex-none`}>
            Apply
          </button>
          <Link href="/expenses" className={button("secondary")}>
            Reset
          </Link>
        </div>
        <p className="text-xs text-zinc-500 sm:col-span-6 dark:text-zinc-400">
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
            {formatPaise(totalPaise, currency)}
          </p>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={filtered ? SearchX : ReceiptText}
            className="px-6 py-12"
            action={
              <Link href="/expenses/new" className={button("primary", "sm")}>
              Add an expense
            </Link>
            }
          >
              {filtered
                ? "No expenses match your search or filters."
                : month
                  ? `No expenses in ${formatMonth(month)} yet.`
                  : "You have not added any expenses yet."}
            </EmptyState>
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
                      <CategoryPill name={expense.categoryName} looks={looks} />
                    </td>
                    <td className="max-w-xs truncate px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                      {expense.note ?? ""}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-right font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                      {formatPaise(expense.amount, currency)}
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
                          summary={describe(expense, currency)}
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
                    <CategoryPill name={expense.categoryName} looks={looks} />
                    <span className="text-base font-semibold tabular-nums">
                      {formatPaise(expense.amount, currency)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                    <span className="truncate">{expense.note ?? ""}</span>
                    <span className="shrink-0">{formatDay(expense.date)}</span>
                  </div>
                  {/* Two real buttons, side by side and apart, so a thumb does not
                      hit Delete when aiming for Edit. */}
                  <div className="flex items-center gap-3 pt-2">
                    <Link
                      href={`/expenses/${expense.id}/edit`}
                      className={`${button("secondary")} flex-1`}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit
                    </Link>
                    <DeleteExpenseButton
                      id={expense.id}
                      summary={describe(expense, currency)}
                      variant="button"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {count > 0 ? (
        <nav
          aria-label="Pages"
          data-testid="pager"
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p
            data-testid="pager-range"
            className="text-sm text-zinc-600 dark:text-zinc-400"
          >
            Showing {firstShown}–{lastShown} of {count}
          </p>
          {pageCount > 1 ? (
            <div className="flex items-center gap-2">
              {page > 1 ? (
                <Link
                  href={hrefFor(page - 1)}
                  rel="prev"
                  className={button("secondary")}
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </Link>
              ) : (
                <span aria-disabled="true" className={`${button("secondary")} opacity-50`}>
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  Previous
                </span>
              )}
              <span
                data-testid="pager-page"
                className="min-w-20 text-center text-sm tabular-nums text-zinc-600 dark:text-zinc-400"
              >
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? (
                <Link
                  href={hrefFor(page + 1)}
                  rel="next"
                  className={button("secondary")}
                >
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              ) : (
                <span aria-disabled="true" className={`${button("secondary")} opacity-50`}>
                  Next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </span>
              )}
            </div>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
