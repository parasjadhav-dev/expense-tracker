"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  parseExpenseSubmission,
  type ExpenseFormState,
} from "@/lib/expense-form";
import {
  SAVE_FAILED_MESSAGE,
  expenseFormValues,
  logActionError,
  revalidateExpensePages,
} from "@/lib/action-errors";
import { getUserCurrency } from "@/lib/currency-db";
import { DEFAULT_CURRENCY } from "@/lib/currency";
import { formatPaise } from "@/lib/money";

export async function createExpense(
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  // Checked here, not only in proxy.ts: server actions are POST requests that
  // proxy matchers can miss.
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/expenses/new");
  const userId = session.user.id;

  let result: Awaited<ReturnType<typeof parseExpenseSubmission>>;
  try {
    result = await parseExpenseSubmission(formData, userId);
  } catch (error) {
    logActionError("createExpense", error);
    return {
      status: "error",
      message: SAVE_FAILED_MESSAGE,
      values: expenseFormValues(formData),
    };
  }
  if (!result.ok) return result.state;
  const { amount, date, note, categoryId, categoryName } = result.data;

  try {
    await db.expense.create({
      data: { amount, date, note, userId, categoryId },
    });
  } catch (error) {
    logActionError("createExpense", error);
    return {
      status: "error",
      message: SAVE_FAILED_MESSAGE,
      values: expenseFormValues(formData),
    };
  }

  revalidateExpensePages();
  // The save already succeeded, so a failed lookup must not turn it into an error.
  const currency = await getUserCurrency(userId).catch(() => DEFAULT_CURRENCY);
  return {
    status: "success",
    message: `Saved ${formatPaise(amount, currency)} in ${categoryName}.`,
    savedAt: Date.now(),
  };
}
