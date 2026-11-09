import { z } from "zod";
import { currentMonth, shiftMonth } from "@/lib/expense-filters";
import { parseRupeesToPaise } from "@/lib/money";
import { AMOUNT_MESSAGES } from "@/lib/validations/expense";

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const MAX_MONTHS_BACK = 12;

// The first month a recurring item may run: this month, or up to a year back
// (which creates the months since then straight away).
export function checkStartMonth(month: string, now: Date = new Date()): string | null {
  if (!MONTH_PATTERN.test(month)) return "Choose the first month.";
  const current = currentMonth(now);
  if (month > current) return "The first month cannot be in the future.";
  if (month < shiftMonth(current, -MAX_MONTHS_BACK)) {
    return "The first month can be at most 12 months ago.";
  }
  return null;
}

export const recurringSchema = z.object({
  amount: z.string().transform((value, ctx) => {
    const result = parseRupeesToPaise(value);
    if (result.ok) return result.paise;
    ctx.issues.push({ code: "custom", message: AMOUNT_MESSAGES[result.reason], input: value });
    return z.NEVER;
  }),
  categoryId: z.string().trim().min(1, "Choose a category."),
  dayOfMonth: z.string().transform((value, ctx) => {
    const trimmed = value.trim();
    const day = Number(trimmed);
    if (!/^\d{1,2}$/.test(trimmed) || day < 1 || day > 31) {
      ctx.issues.push({ code: "custom", message: "Enter a day from 1 to 31.", input: value });
      return z.NEVER;
    }
    return day;
  }),
  startMonth: z.string().transform((value, ctx) => {
    const trimmed = value.trim();
    const message = checkStartMonth(trimmed);
    if (message) {
      ctx.issues.push({ code: "custom", message, input: value });
      return z.NEVER;
    }
    return trimmed;
  }),
  note: z
    .string()
    .trim()
    .max(200, "Note must be 200 characters or fewer.")
    .optional()
    .transform((value) => (value ? value : undefined)),
});
