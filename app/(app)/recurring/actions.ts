"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  SAVE_FAILED_MESSAGE,
  logActionError,
  revalidateExpensePages,
} from "@/lib/action-errors";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { currentMonth, shiftMonth } from "@/lib/expense-filters";
import { formatPaise } from "@/lib/money";
import { lastMonthAfterResume } from "@/lib/recurring";
import type {
  RecurringFieldName,
  RecurringFormState,
  RecurringFormValues,
} from "@/lib/recurring-form";
import { generateDueExpenses } from "@/lib/recurring-db";
import { recurringSchema } from "@/lib/validations/recurring";

const FIELDS: RecurringFieldName[] = ["amount", "categoryId", "dayOfMonth", "startMonth", "note"];

function read(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function refresh() {
  revalidateExpensePages();
  revalidatePath("/recurring");
}

export async function createRecurring(
  _prev: RecurringFormState,
  formData: FormData,
): Promise<RecurringFormState> {
  // Checked here, not only in proxy.ts: server actions are POST requests that
  // proxy matchers can miss.
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/recurring");
  const userId = session.user.id;

  const values = Object.fromEntries(
    FIELDS.map((name) => [name, read(formData, name)]),
  ) as RecurringFormValues;

  const parsed = recurringSchema.safeParse(values);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
      values,
    };
  }
  const { amount, categoryId, dayOfMonth, startMonth, note } = parsed.data;

  try {
    // The id comes from the browser, so it must belong to this user.
    const category = await db.category.findFirst({
      where: { id: categoryId, userId },
      select: { id: true },
    });
    if (!category) {
      return {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { categoryId: ["Choose one of your categories."] },
        values,
      };
    }

    await db.recurringExpense.create({
      data: {
        userId,
        categoryId,
        amount,
        note: note ?? null,
        dayOfMonth,
        startMonth,
        lastGeneratedMonth: shiftMonth(startMonth, -1),
      },
    });
    // Anything already due (this month's day has passed) is added right away.
    const added = await generateDueExpenses(userId);
    refresh();

    return {
      status: "success",
      message: `Saved ${formatPaise(amount)} every month on day ${dayOfMonth}.${
        added > 0
          ? ` ${added} ${added === 1 ? "expense was" : "expenses were"} added up to today.`
          : ""
      }`,
      savedAt: Date.now(),
    };
  } catch (error) {
    logActionError("createRecurring", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE, values };
  }
}

// Pause or resume. A resumed item carries on from this month; the months it was
// paused are not made up.
export async function setRecurringActive(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/recurring");
  const userId = session.user.id;

  const id = read(formData, "id");
  const active = read(formData, "active") === "true";
  if (id === "") return;

  try {
    const item = await db.recurringExpense.findFirst({
      where: { id, userId },
      select: { lastGeneratedMonth: true },
    });
    if (!item) return;
    await db.recurringExpense.updateMany({
      where: { id, userId },
      data: active
        ? {
            active: true,
            lastGeneratedMonth: lastMonthAfterResume(currentMonth(), item.lastGeneratedMonth),
          }
        : { active: false },
    });
    refresh();
  } catch (error) {
    logActionError("setRecurringActive", error);
  }
}

// Removes the item. Expenses it already created stay (they just stop being linked
// to it).
export async function deleteRecurring(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/recurring");
  const userId = session.user.id;

  const id = read(formData, "id");
  if (id === "") return;
  try {
    // Ownership is part of the delete itself.
    await db.recurringExpense.deleteMany({ where: { id, userId } });
    refresh();
  } catch (error) {
    logActionError("deleteRecurring", error);
  }
}
