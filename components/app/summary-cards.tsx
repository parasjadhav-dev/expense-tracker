import Link from "next/link";
import { CalendarClock, PiggyBank, Wallet, type LucideIcon } from "lucide-react";
import type { BudgetLine, SafeToSpend } from "@/lib/budget";
import type { CurrencyCode } from "@/lib/currency";
import { formatMonth } from "@/lib/expense-filters";
import { formatPaise } from "@/lib/money";
import { card, iconChip } from "@/lib/ui";
import { safeToSpendView } from "./safe-to-spend";

type Tone = "normal" | "alert";

// On a phone the three numbers share two rows: "Safe to spend per day" is the
// hero and takes the full width, "Spent" and "Remaining" sit side by side as
// small tiles. From sm up all three are equal cards in one row.
function Card({
  id,
  label,
  value,
  caption,
  icon: Icon,
  tone = "normal",
  hero = false,
}: {
  id: string;
  label: string;
  value: string;
  caption: React.ReactNode;
  icon: LucideIcon;
  tone?: Tone;
  hero?: boolean;
}) {
  return (
    <div
      data-testid="summary-card"
      data-card={id}
      className={`${card} p-4 sm:p-5 ${
        hero ? "order-first col-span-2 sm:order-none sm:col-span-1" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <span className={`${iconChip} ${hero ? "" : "max-sm:hidden"}`}>
          <Icon className="size-[18px]" aria-hidden="true" />
        </span>
      </div>
      <p
        data-testid="summary-value"
        className={`mt-2 break-words font-semibold leading-tight tracking-tight tabular-nums sm:mt-3 sm:text-[28px] ${
          hero ? "text-[28px]" : "text-xl"
        } ${
          tone === "alert"
            ? "text-red-700 dark:text-red-400"
            : "text-zinc-950 dark:text-zinc-50"
        }`}
      >
        {value}
      </p>
      <p
        data-testid="summary-caption"
        className="mt-1 text-xs leading-relaxed text-zinc-600 sm:mt-1.5 dark:text-zinc-400"
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
  currency,
}: {
  month: string;
  isCurrentMonth?: boolean;
  overall: BudgetLine;
  safe: SafeToSpend;
  currency: CurrencyCode;
}) {
  const budget = overall.budget;
  const safeView = safeToSpendView(safe, currency);
  // Rounded down, and capped so a wildly overspent month reads "over 999%"
  // instead of a six-digit number.
  const percent = Math.floor(overall.percentUsed ?? 0);
  const percentText = percent > 999 ? "over 999%" : `${percent}%`;
  const setBudgetLink = (
    <Link
      href={`/budgets?month=${month}`}
      className="font-medium text-[#0f766e] underline underline-offset-4 dark:text-[#5eead4]"
    >
      Set an overall budget
    </Link>
  );

  return (
    <section
      aria-label={`Summary for ${formatMonth(month)}`}
      data-testid="summary-cards"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:gap-5"
    >
      <Card
        id="spent"
        icon={Wallet}
        label={isCurrentMonth ? "Spent this month" : `Spent in ${formatMonth(month)}`}
        value={formatPaise(overall.spent, currency)}
        caption={
          budget !== null
            ? `${percentText} of your ${formatPaise(budget, currency)} budget`
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
          value={formatPaise(overall.remaining ?? 0, currency)}
          tone={(overall.remaining ?? 0) < 0 ? "alert" : "normal"}
          caption={
            (overall.remaining ?? 0) < 0
              ? `Over your ${formatPaise(budget, currency)} budget`
              : `of your ${formatPaise(budget, currency)} budget`
          }
        />
      )}

      <Card
        id="safe"
        hero
        icon={CalendarClock}
        label="Safe to spend per day"
        value={safeView.amount ?? "Not available"}
        tone={safeView.tone}
        caption={safe.kind === "no-budget" ? setBudgetLink : safeView.detail}
      />
    </section>
  );
}
