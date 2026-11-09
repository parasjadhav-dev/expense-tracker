"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  parseExpenseSubmission,
  type ExpenseFormState,
} from "@/lib/expense-form";
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

  const result = await parseExpenseSubmission(formData, userId);
  if (!result.ok) return result.state;
  const { amount, date, note, categoryId, categoryName } = result.data;

  await db.expense.create({
    data: { amount, date, note, userId, categoryId },
  });

  return {
    status: "success",
    message: `Saved ${formatPaise(amount)} in ${categoryName}.`,
    savedAt: Date.now(),
  };
}
