import { z } from "zod";
import { parseRupeesToPaise } from "@/lib/money";
import { todayInAppZone } from "@/lib/time";

export const AMOUNT_MESSAGES = {
  invalid: "Enter an amount like 199 or 199.50.",
  zero: "Amount must be greater than zero.",
  too_large: "Amount is too large.",
} as const;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EARLIEST_DATE = new Date("2000-01-01T00:00:00.000Z");

// Expense dates are calendar dates. They are stored at UTC midnight so a date
// never moves into another day or month because of a time zone.
export function parseDateOnly(value: string): Date | null {
  if (!DATE_PATTERN.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  // Rejects rollovers such as 2026-02-31.
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

// The latest allowed date is today in the app time zone (see lib/time.ts), the
// same calendar the dashboard and budgets use, so an expense can never land in a
// month the dashboard does not show yet.
function latestAllowedDate(): Date {
  return new Date(`${todayInAppZone()}T00:00:00.000Z`);
}

export const expenseSchema = z.object({
  amount: z.string().transform((value, ctx) => {
    const result = parseRupeesToPaise(value);
    if (result.ok) return result.paise;
    ctx.issues.push({
      code: "custom",
      message: AMOUNT_MESSAGES[result.reason],
      input: value,
    });
    return z.NEVER;
  }),
  categoryId: z.string().trim().min(1, "Choose a category."),
  date: z.string().transform((value, ctx) => {
    const date = parseDateOnly(value.trim());
    let message: string | null = null;
    if (!date) message = "Enter a valid date.";
    else if (date < EARLIEST_DATE) message = "Date is too far in the past.";
    else if (date > latestAllowedDate()) message = "Date cannot be in the future.";

    if (message || !date) {
      ctx.issues.push({ code: "custom", message: message!, input: value });
      return z.NEVER;
    }
    return date;
  }),
  note: z
    .string()
    .trim()
    .max(200, "Note must be 200 characters or fewer.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type ExpenseInput = z.output<typeof expenseSchema>;
