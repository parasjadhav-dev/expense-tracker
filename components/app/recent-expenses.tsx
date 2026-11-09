import Link from "next/link";
import { ArrowRight, ReceiptText } from "lucide-react";
import { formatShortDay } from "@/lib/format";
import { formatPaise } from "@/lib/money";
import type { ExpenseListItem } from "@/lib/expenses";
import { card, iconChip } from "@/lib/ui";

// A short list of expenses, used on the dashboard and beside the add and edit
// forms so those pages are never a lone form in an empty page.
export function RecentExpenses({
  id,
  title,
  items,
  emptyText,
  footerHref,
  footerLabel,
  emptyAction,
}: {
  id: string;
  title: string;
  items: ExpenseListItem[];
  emptyText: string;
  footerHref?: string;
  footerLabel?: string;
  // Shown under the empty-state text, for example an "Add an expense" button.
  emptyAction?: React.ReactNode;
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
            className="inline-flex items-center gap-1 text-sm font-medium text-[#1c5cab] hover:underline dark:text-[#6da7ec]"
          >
            {footerLabel ?? "View all"}
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
          <span className={`${iconChip} size-11`}>
            <ReceiptText className="size-5" aria-hidden="true" />
          </span>
          <p className="max-w-[16rem] text-sm text-zinc-600 dark:text-zinc-400">
            {emptyText}
          </p>
          {emptyAction}
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-900">
          {items.map((item) => (
            <li
              key={item.id}
              data-testid="recent-expense"
              className="flex items-center gap-3 py-2.5"
            >
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400"
              >
                {item.categoryName.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {item.note || item.categoryName}
                </p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {item.categoryName} · {formatShortDay(item.date)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                {formatPaise(item.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
