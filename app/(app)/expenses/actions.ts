"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  DELETE_FAILED_MESSAGE,
  logActionError,
  revalidateExpensePages,
} from "@/lib/action-errors";
import { db } from "@/lib/db";

export type DeleteExpenseState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export async function deleteExpense(
  _prevState: DeleteExpenseState,
  formData: FormData,
): Promise<DeleteExpenseState> {
  // Checked here, not only in proxy.ts: server actions are POST requests that
  // proxy matchers can miss.
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/expenses");
  const userId = session.user.id;

  const id = formData.get("id");
  if (typeof id !== "string" || id === "") {
    return { status: "error", message: "Could not tell which expense to delete." };
  }

  // The id comes from the browser, so ownership is part of the delete itself:
  // it can only ever match an expense belonging to the signed-in user.
  let count: number;
  try {
    ({ count } = await db.expense.deleteMany({ where: { id, userId } }));
  } catch (error) {
    logActionError("deleteExpense", error);
    return { status: "error", message: DELETE_FAILED_MESSAGE };
  }

  // Refresh the list and totals either way, so a stale row disappears too.
  revalidateExpensePages();

  if (count === 0) {
    return { status: "error", message: "This expense no longer exists." };
  }
  return { status: "success" };
}
