import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";
import type { CategoryLooks } from "@/lib/category-style";
import type { CurrencyCode } from "@/lib/currency";
import { formatShortDay } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import type { ExpenseListItem } from "@/lib/expenses";
import { card, tapTarget } from "@/lib/ui";
import { EmptyState } from "@/components/ui/empty-state";
import { CategoryBadge } from "./category-badge";

const PHONE_ROWS = 4;

// A short list of expenses, used on the dashboard and beside the add and edit
// forms so those pages are never a lone form in an empty page.
export function RecentExpenses({
  id,
  title,
  items,
  currency,
  emptyText,
  footerHref,
  footerLabel,
  emptyAction,
  looks,
}: {
  id: string;
  title: string;
  items: ExpenseListItem[];
  currency: CurrencyCode;
  emptyText: string;
  footerHref?: string;
  footerLabel?: string;
  // Shown under the empty-state text, for example an "Add an expense" button.
  emptyAction?: React.ReactNode;
  looks?: CategoryLooks;
}) {
  return (
    <section
      aria-labelledby={id}
      data-testid="recent-expenses"
      className={`${card} flex flex-col p-5`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2
          id={id}
          className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          {title}
        </h2>
        {footerHref && items.length > 0 ? (
          <Link
            href={footerHref}
            className={`${tapTarget} inline-flex items-center gap-1 text-sm font-medium text-[#0f766e] hover:underline dark:text-[#5eead4]`}
          >
            {footerLabel ?? "View all"}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState icon={ReceiptText} action={emptyAction}>
          {emptyText}
        </EmptyState>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-900">
          {items.map((item, index) => (
            <li
              key={item.id}
              data-testid="recent-expense"
              // A phone shows the latest few; "View all" has the rest.
              className={`flex items-center gap-3 py-2.5 ${index >= PHONE_ROWS ? "max-sm:hidden" : ""}`}
            >
              <CategoryBadge name={item.categoryName} looks={looks} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {item.note || item.categoryName}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {item.categoryName} · {formatShortDay(item.date)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                {formatPaise(item.amount, currency)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
