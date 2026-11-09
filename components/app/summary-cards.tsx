import Link from "next/link";
import { CalendarClock, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import type { BudgetLine, SafeToSpend } from "@/lib/budget";
import { formatMonth } from "@/lib/expense-filters";
import { formatPaise } from "@/lib/money";
import { card, iconChip } from "@/lib/ui";
import { safeToSpendView } from "./safe-to-spend";

type Tone = "normal" | "alert";

function Card({
  id,
  label,
  value,
  caption,
  icon: Icon,
  tone = "normal",
}: {
  id: string;
  label: string;
  value: string;
  caption: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div
      data-testid="summary-card"
      data-card={id}
      className={`${card} p-5`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <span className={iconChip}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p
        data-testid="summary-value"
        className={`mt-3 text-[28px] font-semibold leading-tight tracking-tight tabular-nums ${
          tone === "alert"
            ? "text-red-700 dark:text-red-400"
            : "text-zinc-950 dark:text-zinc-50"
        }`}
      >
        {value}
      </p>
      <p
        data-testid="summary-caption"
        className="mt-1.5 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400"
      >
        {caption}
      </p>
    </div>
  );
}

// The three headline numbers for one month: total spent, what is left of the
// overall budget, and how much can be spent per day.
export function SummaryCards({
  month,
  isCurrentMonth = true,
  overall,
  safe,
}: {
  month: string;
  isCurrentMonth?: boolean;
  overall: BudgetLine;
  safe: SafeToSpend;
}) {
  const budget = overall.budget;
  const safeView = safeToSpendView(safe);
  // Rounded down, and capped so a wildly overspent month reads "over 999%"
  // instead of a six-digit number.
  const percent = Math.floor(overall.percentUsed ?? 0);
  const percentText = percent > 999 ? "over 999%" : `${percent}%`;
  const setBudgetLink = (
    <Link
      href={`/budgets?month=${month}`}
      className="font-medium text-[#1c5cab] underline underline-offset-4 dark:text-[#6da7ec]"
    >
      Set an overall budget
    </Link>
  );

  return (
    <section
      aria-label={`Summary for ${formatMonth(month)}`}
      data-testid="summary-cards"
      className="grid gap-4 sm:grid-cols-3 md:gap-5"
    >
      <Card
        id="spent"
        icon={Wallet}
        label={isCurrentMonth ? "Spent this month" : `Spent in ${formatMonth(month)}`}
        value={formatPaise(overall.spent)}
        caption={
          budget !== null
            ? `${percentText} of your ${formatPaise(budget)} budget`
            : "No overall budget set"
        }
      />

      {budget === null ? (
        <Card
          id="remaining"
          icon={PiggyBank}
          label="Remaining"
          value="Not set"
          caption={setBudgetLink}
        />
      ) : (
        <Card
          id="remaining"
          icon={PiggyBank}
          label="Remaining"
          value={formatPaise(overall.remaining ?? 0)}
          tone={(overall.remaining ?? 0) < 0 ? "alert" : "normal"}
          caption={
            (overall.remaining ?? 0) < 0
              ? `Over your ${formatPaise(budget)} budget`
              : `of your ${formatPaise(budget)} budget`
          }
        />
      )}

      <Card
        id="safe"
        icon={CalendarClock}
        label="Safe to spend per day"
        value={safeView.amount ?? "Not available"}
        tone={safeView.tone}
        caption={safe.kind === "no-budget" ? setBudgetLink : safeView.detail}
      />
    </section>
  );
}
