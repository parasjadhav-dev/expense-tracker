import { todayInAppZone } from "@/lib/time";

// Month filters use "YYYY-MM". Expense dates are stored as UTC-midnight calendar
// dates, so month boundaries are UTC too. Which month is "current" follows the
// app time zone.

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const EARLIEST_YEAR = 2000;

// The current month in the app time zone (see lib/time.ts), so it rolls over at
// local midnight, not at UTC midnight.
export function currentMonth(now: Date = new Date()): string {
  return todayInAppZone(now).slice(0, 7);
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

// "2026-11" -> "November 2026"
export function formatMonth(month: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00.000Z`));
}

// "2026-11", 1 -> "2026-12"; "2026-01", -1 -> "2025-12"
export function shiftMonth(month: string, by: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1 + by, 1))
    .toISOString()
    .slice(0, 7);
}

export function monthRange(month: string): { gte: Date; lt: Date } {
  const [year, monthNumber] = month.split("-").map(Number);
  return {
    gte: new Date(Date.UTC(year, monthNumber - 1, 1)),
    lt: new Date(Date.UTC(year, monthNumber, 1)),
  };
}
