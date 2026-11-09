import { z } from "zod";
import { currentMonth } from "@/lib/expense-filters";
import { parseRupeesToPaise } from "@/lib/money";
import { AMOUNT_MESSAGES } from "@/lib/validations/expense";

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const EARLIEST_YEAR = 2000;
const MAX_MONTHS_AHEAD = 24;

function monthIndex(month: string): number {
  const [year, monthNumber] = month.split("-").map(Number);
  return year * 12 + (monthNumber - 1);
}

// Returns an error message, or null when the month can hold a budget.
export function checkBudgetMonth(
  month: string,
  now: Date = new Date(),
): string | null {
  const match = MONTH_PATTERN.exec(month);
  if (!match) return "Choose a valid month.";
  if (Number(match[1]) < EARLIEST_YEAR) return "Month is too far in the past.";
  if (monthIndex(month) > monthIndex(currentMonth(now)) + MAX_MONTHS_AHEAD) {
    return "Month is too far ahead.";
  }
  return null;
}

export const overallBudgetSchema = z.object({
  month: z.string().transform((value, ctx) => {
    const trimmed = value.trim();
    const message = checkBudgetMonth(trimmed);
    if (message) {
      ctx.issues.push({ code: "custom", message, input: value });
      return z.NEVER;
    }
    return trimmed;
  }),
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
});
