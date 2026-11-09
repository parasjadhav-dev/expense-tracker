// Pure budget maths. No database, no clock, no I/O, and no imports: callers load
// the month's data and pass it in, so every function here is easy to test.
//
// All amounts are integer paise. Comparisons use integer arithmetic only, so
// results at a threshold (such as exactly 80%) are exact, not subject to float
// rounding.

// Spending at or above this share of a budget counts as a warning.
export const WARNING_THRESHOLD_PERCENT = 80;

// "none"    no budget is set
// "ok"      under the warning threshold
// "warning" at or above 80% but still under the budget
// "limit"   at or above 100%: the budget is fully used or exceeded
export type BudgetStatus = "none" | "ok" | "warning" | "limit";

// The only fields the maths needs from an expense.
export type SpendEntry = { categoryId: string; amount: number };

// A budget counts only when it is a positive finite number. null, undefined, 0
// and negatives all mean "no budget".
function hasBudget(budget: number | null | undefined): budget is number {
  return typeof budget === "number" && Number.isFinite(budget) && budget > 0;
}

export function totalSpent(expenses: readonly SpendEntry[]): number {
  let total = 0;
  for (const expense of expenses) total += expense.amount;
  return total;
}

// Spending per category. Categories with no expenses are absent: use
// `.get(id) ?? 0`.
export function spentByCategory(
  expenses: readonly SpendEntry[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const { categoryId, amount } of expenses) {
    totals.set(categoryId, (totals.get(categoryId) ?? 0) + amount);
  }
  return totals;
}

// Budget minus spending. Negative when overspent; null when there is no budget.
export function remaining(
  spent: number,
  budget: number | null | undefined,
): number | null {
  return hasBudget(budget) ? budget - spent : null;
}

// How far past the budget spending is. 0 when within budget or when there is no
// budget.
export function overBy(
  spent: number,
  budget: number | null | undefined,
): number {
  return hasBudget(budget) ? Math.max(0, spent - budget) : 0;
}

// Spending as a percentage of the budget, unrounded and unclamped (it can
// exceed 100). null when there is no budget. Callers round and clamp for display.
export function percentUsed(
  spent: number,
  budget: number | null | undefined,
): number | null {
  return hasBudget(budget) ? (spent / budget) * 100 : null;
}

// True only when spending is strictly above the budget. Spending exactly the
// budget leaves 0 remaining but is not "over".
export function isOverBudget(
  spent: number,
  budget: number | null | undefined,
): boolean {
  return hasBudget(budget) && spent > budget;
}

export function budgetStatus(
  spent: number,
  budget: number | null | undefined,
): BudgetStatus {
  if (!hasBudget(budget)) return "none";
  if (spent >= budget) return "limit";
  // spent / budget >= 80%, written without division.
  if (spent * 100 >= budget * WARNING_THRESHOLD_PERCENT) return "warning";
  return "ok";
}

export type BudgetLine = {
  budget: number | null;
  spent: number;
  remaining: number | null;
  percentUsed: number | null;
  status: BudgetStatus;
};

export type CategoryBudgetLine = BudgetLine & {
  categoryId: string;
  name: string;
};

export type BudgetSummary = {
  overall: BudgetLine;
  categories: CategoryBudgetLine[];
};

function line(spent: number, budget: number | null | undefined): BudgetLine {
  return {
    budget: hasBudget(budget) ? budget : null,
    spent,
    remaining: remaining(spent, budget),
    percentUsed: percentUsed(spent, budget),
    status: budgetStatus(spent, budget),
  };
}

// Combines the helpers for one month. `expenses` must already be limited to that
// month. The overall line counts every expense passed in; each category line
// counts only that category's expenses, in the order of `categories`.
export function summarizeBudgets(input: {
  overallBudget: number | null | undefined;
  categoryBudgets: Readonly<Record<string, number>>;
  categories: readonly { id: string; name: string }[];
  expenses: readonly SpendEntry[];
}): BudgetSummary {
  const { overallBudget, categoryBudgets, categories, expenses } = input;
  const spent = spentByCategory(expenses);

  return {
    overall: line(totalSpent(expenses), overallBudget),
    categories: categories.map(({ id, name }) => ({
      categoryId: id,
      name,
      ...line(
        spent.get(id) ?? 0,
        Object.prototype.hasOwnProperty.call(categoryBudgets, id)
          ? categoryBudgets[id]
          : null,
      ),
    })),
  };
}

// "over"     spending is strictly above the budget
// "reached"  spending equals the budget exactly (nothing left, not yet over)
// "warning"  at or above the warning threshold but still under the budget
export type BudgetAlertKind = "over" | "reached" | "warning";

export type BudgetAlert = {
  kind: BudgetAlertKind;
  scope: "overall" | "category";
  categoryId: string | null;
  name: string;
  budget: number;
  spent: number;
  overBy: number;
  percentUsed: number;
};

const ALERT_RANK: Record<BudgetAlertKind, number> = {
  over: 0,
  reached: 1,
  warning: 2,
};

// One alert for each overall or category budget that needs attention, most
// serious first. Within the same level the overall budget comes first, then
// categories in the order they were given. Budgets that are comfortably within
// limits, and spending with no budget, produce nothing.
export function budgetAlerts(summary: BudgetSummary): BudgetAlert[] {
  const candidates: {
    scope: "overall" | "category";
    categoryId: string | null;
    name: string;
    line: BudgetLine;
  }[] = [
    { scope: "overall", categoryId: null, name: "Overall", line: summary.overall },
    ...summary.categories.map((category) => ({
      scope: "category" as const,
      categoryId: category.categoryId,
      name: category.name,
      line: category,
    })),
  ];

  const alerts: BudgetAlert[] = [];
  for (const { scope, categoryId, name, line: l } of candidates) {
    if (l.budget === null) continue;
    const kind: BudgetAlertKind | null = isOverBudget(l.spent, l.budget)
      ? "over"
      : l.status === "limit"
        ? "reached"
        : l.status === "warning"
          ? "warning"
          : null;
    if (kind === null) continue;
    alerts.push({
      kind,
      scope,
      categoryId,
      name,
      budget: l.budget,
      spent: l.spent,
      overBy: overBy(l.spent, l.budget),
      percentUsed: l.percentUsed ?? 0,
    });
  }

  // Array.prototype.sort is stable, so the order above is kept within a level.
  return alerts.sort((a, b) => ALERT_RANK[a.kind] - ALERT_RANK[b.kind]);
}

// ---------------------------------------------------------------------------
// Safe to spend per day
// ---------------------------------------------------------------------------

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const MONTH_FORMAT = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_FORMAT = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// Number of days in a "YYYY-MM" month. Throws on anything else, so a bad month
// can never turn into a silent NaN further down.
export function daysInMonth(month: string): number {
  const match = MONTH_FORMAT.exec(month);
  if (!match) throw new RangeError(`Invalid month: ${month}`);
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber === 2) return isLeapYear(year) ? 29 : 28;
  return [4, 6, 9, 11].includes(monthNumber) ? 30 : 31;
}

// Days left in `month`, counting `today` itself, as seen from `today`
// ("YYYY-MM-DD"). A month that has not started has all of its days left; a
// month that has ended has none. The clock is passed in, never read here.
export function daysLeftInMonth(month: string, today: string): number {
  const total = daysInMonth(month);
  const match = DAY_FORMAT.exec(today);
  if (!match) throw new RangeError(`Invalid date: ${today}`);

  const todayMonth = `${match[1]}-${match[2]}`;
  if (todayMonth < month) return total; // month not started (ISO strings sort)
  if (todayMonth > month) return 0; // month already over
  return total - Number(match[3]) + 1;
}

// "no-budget"    no overall budget is set
// "over"         spending is above the budget; nothing is safe to spend
// "budget-used"  spending equals the budget exactly; nothing left
// "month-ended"  no days remain and part of the budget was never used
// "ok"           perDay is the most that can be spent each remaining day
export type SafeToSpend =
  | { kind: "no-budget" }
  | { kind: "over"; overBy: number }
  | { kind: "budget-used" }
  | { kind: "month-ended"; remaining: number }
  | {
      kind: "ok";
      perDay: number;
      remaining: number;
      daysLeft: number;
      lastDay: boolean;
    };

// What can be spent each remaining day: what is left of the budget, shared
// across the days left, rounded DOWN to a whole paisa so it never promises more
// than is available (so perDay can be 0 when only a few paise remain).
//
// The division happens only in the "ok" branch, which needs remaining > 0 and at
// least one day left, so there is no divide-by-zero for any input.
export function safeToSpend(input: {
  budget: number | null | undefined;
  spent: number;
  daysLeft: number;
}): SafeToSpend {
  const { budget, spent, daysLeft } = input;
  if (!hasBudget(budget)) return { kind: "no-budget" };
  if (spent > budget) return { kind: "over", overBy: spent - budget };

  const left = budget - spent;
  if (left === 0) return { kind: "budget-used" };

  // Anything that is not a real count of at least one day (0, negatives, NaN,
  // Infinity) means "no days left".
  if (!(Number.isFinite(daysLeft) && daysLeft >= 1)) {
    return { kind: "month-ended", remaining: left };
  }

  const days = Math.floor(daysLeft);
  return {
    kind: "ok",
    perDay: Math.floor(left / days),
    remaining: left,
    daysLeft: days,
    lastDay: days === 1,
  };
}
