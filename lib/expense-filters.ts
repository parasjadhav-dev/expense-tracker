// Month filters use "YYYY-MM". Expense dates are stored as UTC-midnight calendar
// dates, so month boundaries are UTC too.

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const EARLIEST_YEAR = 2000;

export function currentMonth(now: Date = new Date()): string {
  return now.toISOString().slice(0, 7);
}

// undefined (no ?month=)  -> current month
// ""        (?month=)     -> all months, returned as null
// "2026-11"               -> that month
// anything else           -> current month
export function resolveMonth(
  param: string | undefined,
  now: Date = new Date(),
): string | null {
  if (param === undefined) return currentMonth(now);
  if (param === "") return null;

  const match = MONTH_PATTERN.exec(param);
  if (!match || Number(match[1]) < EARLIEST_YEAR) return currentMonth(now);
  return param;
}

export function monthRange(month: string): { gte: Date; lt: Date } {
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
    lt: new Date(Date.UTC(year, monthNumber, 1)),
  };
}
