import type { SafeToSpend as SafeToSpendResult } from "@/lib/budget";
import { formatPaise } from "@/lib/money";

function days(count: number): string {
  return count === 1 ? "1 day" : `${count} days`;
}

export type SafeToSpendView = {
  // The per-day amount, e.g. "₹1,000.00". null when there is nothing to show.
  amount: string | null;
  // A sentence explaining the amount (or why there is none).
  detail: string;
  // "alert" when spending is over the budget.
  tone: "normal" | "alert";
};

// The wording for every case, shared by the Safe to spend block on /budgets and
// the dashboard card so the two cannot disagree.
export function safeToSpendView(safe: SafeToSpendResult): SafeToSpendView {
  switch (safe.kind) {
    case "ok":
      return {
        amount: formatPaise(safe.perDay),
        detail: safe.lastDay
          ? `Last day of the month: up to ${formatPaise(safe.remaining)} left to spend today.`
          : `${formatPaise(safe.remaining)} left over ${days(safe.daysLeft)}, counting today.`,
        tone: "normal",
      };
    case "over":
      return {
        amount: formatPaise(0),
        detail: `You are over your overall budget by ${formatPaise(safe.overBy)}.`,
        tone: "alert",
      };
    case "budget-used":
      return {
        amount: formatPaise(0),
        detail: "You have used your whole overall budget.",
        tone: "normal",
      };
    case "month-ended":
      return {
        amount: null,
        detail: `This month has ended. ${formatPaise(safe.remaining)} of the overall budget was not used.`,
        tone: "normal",
      };
    case "no-budget":
      return {
        amount: null,
        detail: "Set an overall budget to see how much you can spend each day.",
        tone: "normal",
      };
  }
}

// How much can be spent each remaining day without breaking the overall budget.
// Always says something: there is a message for every case, including no
// budget, over budget and a finished month.
export function SafeToSpend({ safe }: { safe: SafeToSpendResult }) {
  const view = safeToSpendView(safe);

  return (
    <div
      data-testid="safe-to-spend"
      data-kind={safe.kind}
      className="rounded-xl bg-gradient-to-br from-[#2a78d6]/[0.08] to-[#2a78d6]/[0.02] px-4 py-3.5 ring-1 ring-[#2a78d6]/15 dark:from-[#3987e5]/15 dark:to-transparent dark:ring-[#3987e5]/25"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Safe to spend
      </p>
      {view.amount !== null ? (
        <p
          data-testid="safe-per-day"
          className={`mt-1 text-2xl font-semibold tabular-nums ${
            view.tone === "alert"
              ? "text-red-700 dark:text-red-400"
              : "text-zinc-950 dark:text-zinc-50"
          }`}
        >
          {view.amount}{" "}
          <span className="text-sm font-normal text-zinc-500 dark:text-zinc-400">
            a day
          </span>
        </p>
      ) : null}
      <p
        data-testid="safe-detail"
        className={`mt-1 text-zinc-600 dark:text-zinc-400 ${
          view.amount !== null ? "text-xs" : "text-sm"
        }`}
      >
        {view.detail}
      </p>
    </div>
  );
}
