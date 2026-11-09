"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { SAVE_FAILED_MESSAGE, logActionError } from "@/lib/action-errors";
import { saveCategoryBudgets, saveOverallBudget } from "@/lib/budgets";
import { db } from "@/lib/db";
import { formatMonth } from "@/lib/expense-filters";
import { formatPaise, parseRupeesToPaise } from "@/lib/money";
import { AMOUNT_MESSAGES } from "@/lib/validations/expense";
import {
  checkBudgetMonth,
  overallBudgetSchema,
} from "@/lib/validations/budget";

export type BudgetFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"month" | "amount", string[]>>;
  // Echoed back so the form can refill itself after an error.
  values?: { amount: string };
};

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function saveOverallBudgetAction(
  _prevState: BudgetFormState,
  formData: FormData,
): Promise<BudgetFormState> {
  // Checked here, not only in proxy.ts: server actions are POST requests that
  // proxy matchers can miss.
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/budgets");
  const userId = session.user.id;

  const values = { amount: text(formData, "amount") };
  // The month comes from a hidden input, so it is validated like any other input.
  const parsed = overallBudgetSchema.safeParse({
    month: text(formData, "month"),
    amount: values.amount,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }

  const { month, amount } = parsed.data;
  try {
    await saveOverallBudget({ userId, month, amount });
  } catch (error) {
    logActionError("saveOverallBudget", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE, values };
  }
  revalidatePath("/budgets");

  return {
    status: "success",
    message: `Budget for ${formatMonth(month)} set to ${formatPaise(amount)}.`,
  };
}

export type CategoryBudgetsState = {
  status: "idle" | "success" | "error";
  message?: string;
  // One message per category id.
  rowErrors?: Record<string, string>;
  // Echoed back so the form can refill itself after an error.
  values?: Record<string, string>;
};

export async function saveCategoryBudgetsAction(
  _prevState: CategoryBudgetsState,
  formData: FormData,
): Promise<CategoryBudgetsState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/budgets");
  const userId = session.user.id;

  // The month comes from a hidden input, so it is validated like any other input.
  const month = text(formData, "month").trim();
  const monthError = checkBudgetMonth(month);
  if (monthError) return { status: "error", message: monthError };

  // The category list comes from the database, never from the form, so ids
  // that do not belong to this user are simply ignored.
  let categories: { id: string }[];
  try {
    categories = await db.category.findMany({
      where: { userId },
      select: { id: true },
    });
  } catch (error) {
    logActionError("saveCategoryBudgets", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE };
  }

  const values: Record<string, string> = {};
  const rowErrors: Record<string, string> = {};
  const entries: { categoryId: string; amount: number | null }[] = [];

  for (const { id } of categories) {
    const raw = text(formData, `amount:${id}`);
    values[id] = raw;
    if (raw.trim() === "") {
      entries.push({ categoryId: id, amount: null }); // blank = no limit
      continue;
    }
    const parsed = parseRupeesToPaise(raw);
    if (parsed.ok) entries.push({ categoryId: id, amount: parsed.paise });
    else rowErrors[id] = AMOUNT_MESSAGES[parsed.reason];
  }

  // All or nothing: nothing is written if any field is invalid.
  if (Object.keys(rowErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      rowErrors,
      values,
    };
  }

  try {
    await saveCategoryBudgets({ userId, month, entries });
  } catch (error) {
    logActionError("saveCategoryBudgets", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE, values };
  }
  revalidatePath("/budgets");

  return {
    status: "success",
    message: `Category budgets for ${formatMonth(month)} saved.`,
  };
}
