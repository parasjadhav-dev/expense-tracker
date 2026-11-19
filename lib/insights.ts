// The short, plain-language observations on the dashboard: how this month compares
// with last, whether the pace will break the budget, and which category moved
// most. Pure: the clock and the data are passed in, nothing here touches the
// database. Amounts are integer minor units (paise, cents...).

import type { CurrencyCode } from "@/lib/currency";
import { formatPaise } from "@/lib/money";

export type InsightTone = "good" | "warn" | "bad" | "neutral";
export type InsightKind = "pace" | "projection" | "mover";

export type Insight = {
  id: string;
  kind: InsightKind;
  tone: InsightTone;
  title: string;
  detail?: string;
  // Where "Set a budget" and similar go.
  href?: string;
  hrefLabel?: string;
};

// Do not guess a month's total from fewer days than this.
export const MIN_DAYS_FOR_PROJECTION = 3;
// Changes smaller than this (in percent) read as "about the same".
const SAME_PERCENT = 2;

const MONTH_FORMAT = /^(\d{4})-(0[1-9]|1[0-2])$/;
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const LONG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function monthParts(month: string): { year: number; index: number } {
  const match = MONTH_FORMAT.exec(month);
  if (!match) throw new RangeError(`Invalid month: ${month}`);
  return { year: Number(match[1]), index: Number(match[2]) - 1 };
}

export function previousMonthOf(month: string): string {
  const { year, index } = monthParts(month);
  const total = year * 12 + index - 1;
  const y = Math.floor(total / 12);
  return `${String(y).padStart(4, "0")}-${String((total % 12) + 1).padStart(2, "0")}`;
}

function daysIn(month: string): number {
  const { year, index } = monthParts(month);
  return new Date(Date.UTC(year, index + 1, 0)).getUTCDate();
}

// Total spent in `month` on days 1..day (inclusive), from per-day totals.
export function spentThroughDay(
  dailyTotals: readonly { date: string; amount: number }[],
  month: string,
  day: number,
): number {
  let sum = 0;
  for (const { date, amount } of dailyTotals) {
    if (date.slice(0, 7) === month && Number(date.slice(8, 10)) <= day) sum += amount;
  }
  return sum;
}

// A whole-number percentage change from `before` to `now`, or null when there is
// nothing to compare against.
export function percentChange(now: number, before: number): number | null {
  if (before <= 0) return null;
  return Math.round(((now - before) / before) * 100);
}

export type ProjectionInput = {
  spent: number;
  daysElapsed: number;
  daysInMonth: number;
};

// The month's likely total if the daily average so far carries on.
export function projectMonthTotal({ spent, daysElapsed, daysInMonth }: ProjectionInput): number | null {
  if (spent <= 0 || daysElapsed < MIN_DAYS_FOR_PROJECTION || daysElapsed >= daysInMonth) {
    return null;
  }
  return Math.round((spent / daysElapsed) * daysInMonth);
}

// The day of the month on which spending at the current daily average reaches
// `budget`, or null when it does not within the month (or already has).
export function budgetRunOutDay(input: ProjectionInput & { budget: number }): number | null {
  const { spent, daysElapsed, daysInMonth, budget } = input;
  if (spent <= 0 || daysElapsed < 1 || spent >= budget) return null;
  const day = Math.ceil(budget / (spent / daysElapsed));
  return day <= daysInMonth ? day : null;
}

export type CategoryMovement = {
  name: string;
  current: number; // this month (so far)
  previous: number; // last month, over the same days
};

export type InsightInput = {
  month: string; // the month being viewed, "2026-11"
  isCurrentMonth: boolean;
  daysElapsed: number; // days of `month` that have passed (all of them for a past month)
  spent: number; // total spent in `month` so far
  previousSpent: number; // last month's total over the same days
  budget: number | null; // overall budget for `month`
  categories: readonly CategoryMovement[];
  currency: CurrencyCode;
  budgetsHref: string;
};

function longName(month: string): string {
  return LONG_MONTHS[monthParts(month).index];
}

function dayLabel(month: string, day: number): string {
  return `${day} ${SHORT_MONTHS[monthParts(month).index]}`;
}

function paceInsight(input: InsightInput): Insight | null {
  // Nothing spent yet is not a result worth announcing ("100% less").
  if (input.spent <= 0) return null;
  const change = percentChange(input.spent, input.previousSpent);
  if (change === null) return null;
  const previous = longName(previousMonthOf(input.month));
  const compared = input.isCurrentMonth ? `the same point in ${previous}` : previous;

  if (Math.abs(change) < SAME_PERCENT) {
    return {
      id: "pace",
      kind: "pace",
      tone: "neutral",
      title: `About the same as ${compared}`,
      detail: `${formatPaise(input.spent, input.currency)} against ${formatPaise(input.previousSpent, input.currency)}.`,
    };
  }
  const more = change > 0;
  return {
    id: "pace",
    kind: "pace",
    // A big jump is worth flagging; a small one is only information.
    tone: more ? (change >= 25 ? "bad" : "warn") : "good",
    title: `${Math.abs(change)}% ${more ? "more" : "less"} than ${compared}`,
    detail: `${formatPaise(input.spent, input.currency)} against ${formatPaise(input.previousSpent, input.currency)}.`,
  };
}

function projectionInsight(input: InsightInput): Insight | null {
  if (!input.isCurrentMonth) return null;
  const days = daysIn(input.month);
  const base = { spent: input.spent, daysElapsed: input.daysElapsed, daysInMonth: days };
  const projected = projectMonthTotal(base);
  if (projected === null) return null;
  const money = (value: number) => formatPaise(value, input.currency);

  if (input.budget === null) {
    return {
      id: "projection",
      kind: "projection",
      tone: "neutral",
      title: `On pace for about ${money(projected)} this month`,
      detail: "Set an overall budget to see whether that fits.",
      href: input.budgetsHref,
      hrefLabel: "Set a budget",
    };
  }
  // Already over: the alert banner says so; do not repeat it as a forecast.
  if (input.spent >= input.budget) return null;

  if (projected > input.budget) {
    const runOut = budgetRunOutDay({ ...base, budget: input.budget });
    return {
      id: "projection",
      kind: "projection",
      tone: "bad",
      title: `On pace to overshoot by about ${money(projected - input.budget)}`,
      detail:
        runOut !== null
          ? `At this pace your ${money(input.budget)} budget runs out around ${dayLabel(input.month, runOut)}.`
          : `About ${money(projected)} by month end against a ${money(input.budget)} budget.`,
    };
  }
  return {
    id: "projection",
    kind: "projection",
    tone: "good",
    title: `On track to finish about ${money(input.budget - projected)} under budget`,
    detail: `About ${money(projected)} by month end against a ${money(input.budget)} budget.`,
  };
}

function moverInsight(input: InsightInput): Insight | null {
  const previousTotal = input.categories.reduce((sum, c) => sum + c.previous, 0);
  if (previousTotal <= 0) return null;
  // Small wobbles are noise: a mover must be at least 5% of last month's total.
  const threshold = Math.max(1, Math.round(previousTotal * 0.05));

  let best: { category: CategoryMovement; diff: number } | null = null;
  for (const category of input.categories) {
    const diff = category.current - category.previous;
    if (Math.abs(diff) < threshold) continue;
    if (best === null || Math.abs(diff) > Math.abs(best.diff)) best = { category, diff };
  }
  if (best === null) return null;

  const { category, diff } = best;
  const money = formatPaise(Math.abs(diff), input.currency);
  const when = input.isCurrentMonth ? "at this point last month" : `in ${longName(previousMonthOf(input.month))}`;
  const percent = percentChange(category.current, category.previous);
  const percentText = percent === null ? "" : ` (${percent > 0 ? "+" : ""}${percent}%)`;
  return {
    id: "mover",
    kind: "mover",
    tone: diff > 0 ? "warn" : "good",
    title: `${category.name} is ${diff > 0 ? "up" : "down"} ${money}${percentText}`,
    detail:
      category.previous === 0
        ? `Nothing in ${category.name} ${when}.`
        : `${formatPaise(category.current, input.currency)} against ${formatPaise(category.previous, input.currency)} ${when}.`,
  };
}

// Up to three insights, in the order they are most useful: the forecast first
// (it is the one you can act on), then the comparison, then the biggest mover.
export function buildInsights(input: InsightInput): Insight[] {
  return [projectionInsight(input), paceInsight(input), moverInsight(input)].filter(
    (insight): insight is Insight => insight !== null,
  );
}
