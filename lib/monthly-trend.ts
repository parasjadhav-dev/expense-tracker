// Pure maths for the monthly spending trend: which months the chart covers and
// how much was spent in each. No database, no clock, no imports: callers pass in
// the current month and the spending totals.
//
// Months are "YYYY-MM". Spending dates are "YYYY-MM-DD" (or any ISO string that
// starts with one). Amounts are integer paise.

export const TREND_MONTHS = 6;

const MONTH_FORMAT = /^(\d{4})-(0[1-9]|1[0-2])$/;
const SHORT_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const LONG_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function parseMonth(month: string): { year: number; index: number } {
  const match = MONTH_FORMAT.exec(month);
  if (!match) throw new RangeError(`Invalid month: ${month}`);
  return { year: Number(match[1]), index: Number(match[2]) - 1 };
}

// month + offset, e.g. addMonths("2026-11", -5) = "2026-06"
export function addMonths(month: string, offset: number): string {
  const { year, index } = parseMonth(month);
  const total = year * 12 + index + offset;
  const newYear = Math.floor(total / 12);
  const newIndex = total - newYear * 12;
  return `${String(newYear).padStart(4, "0")}-${String(newIndex + 1).padStart(2, "0")}`;
}

// The `count` months ending at `endMonth`, oldest first.
export function lastMonths(endMonth: string, count: number = TREND_MONTHS): string[] {
  const size = Math.max(1, Math.floor(count));
  parseMonth(endMonth); // reject bad input early
  return Array.from({ length: size }, (_, i) => addMonths(endMonth, i - (size - 1)));
}

export type TrendPoint = {
  month: string; // "2026-11"
  label: string; // short axis label, e.g. "Nov" (or "Jan 2027" at a year change)
  longLabel: string; // "November 2026"
  amount: number; // total spent in the month
  isCurrent: boolean; // the last month, which is still in progress
};

export type MonthlyTrend = {
  points: TrendPoint[];
  total: number;
  max: number;
  // Index of the highest month, or -1 when nothing was spent.
  peakIndex: number;
  // True when no month in the window has any spending.
  empty: boolean;
};

// Totals per month for the `count` months ending at `endMonth`. Spending outside
// the window is ignored. Months with no spending are 0, not missing.
export function buildMonthlyTrend(input: {
  endMonth: string;
  // The month that is still running, if it is among the shown ones. Defaults to
  // endMonth; pass the real current month when viewing an earlier one.
  inProgressMonth?: string;
  dailyTotals: readonly { date: string; amount: number }[];
  count?: number;
}): MonthlyTrend {
  const months = lastMonths(input.endMonth, input.count ?? TREND_MONTHS);
  const totals = new Map<string, number>(months.map((month) => [month, 0]));

  for (const { date, amount } of input.dailyTotals) {
    const month = date.slice(0, 7);
    const current = totals.get(month);
    if (current !== undefined) totals.set(month, current + amount);
  }

  // Add the year to the first label and at every January, so a window that
  // crosses a year boundary still reads clearly.
  const points: TrendPoint[] = months.map((month, i) => {
    const { year, index } = parseMonth(month);
    const showYear = i === 0 || index === 0;
    return {
      month,
      label: showYear ? `${SHORT_NAMES[index]} ${year}` : SHORT_NAMES[index],
      longLabel: `${LONG_NAMES[index]} ${year}`,
      amount: totals.get(month) ?? 0,
      isCurrent: month === (input.inProgressMonth ?? input.endMonth),
    };
  });

  const total = points.reduce((sum, point) => sum + point.amount, 0);
  const max = points.reduce((best, point) => Math.max(best, point.amount), 0);
  let peakIndex = -1;
  if (max > 0) {
    // The latest month wins a tie, so the label sits on the most recent peak.
    points.forEach((point, i) => {
      if (point.amount === max) peakIndex = i;
    });
  }

  return { points, total, max, peakIndex, empty: total === 0 };
}
