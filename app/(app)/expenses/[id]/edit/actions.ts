"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  parseExpenseSubmission,
  type ExpenseFormState,
} from "@/lib/expense-form";

// `id` is bound by the edit page. It came from the URL, so it is untrusted: the
// update only matches an expense owned by the signed-in user.
export async function updateExpense(
  id: string,
  _prevState: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/expenses/${id}/edit`);
  const userId = session.user.id;

  const result = await parseExpenseSubmission(formData, userId);
  if (!result.ok) return result.state;
  const { amount, date, note, categoryId } = result.data;

  // Ownership check and write in one statement. note is set to null when blank
  // so clearing the field really clears it.
  const { count } = await db.expense.updateMany({
    where: { id, userId },
    data: { amount, date, note: note ?? null, categoryId },
  });
  if (count === 0) {
    return {
      status: "error",
      message: "This expense no longer exists.",
      values: {
        amount: String(formData.get("amount") ?? ""),
        categoryId: String(formData.get("categoryId") ?? ""),
        date: String(formData.get("date") ?? ""),
        note: String(formData.get("note") ?? ""),
      },
    };
  }

  // Show the list for the edited expense's month, so a date change that moves
  // it to another month does not look like it disappeared.
  redirect(`/expenses?month=${date.toISOString().slice(0, 7)}`);
}
