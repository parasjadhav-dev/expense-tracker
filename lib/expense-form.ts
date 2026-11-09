import { z } from "zod";
import { db } from "@/lib/db";
import { expenseSchema } from "@/lib/validations/expense";

export type FieldName = "amount" | "categoryId" | "date" | "note";

export type ExpenseFormValues = Record<FieldName, string>;

export type ExpenseFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<FieldName, string[]>>;
  // Echoed back so the form can refill itself after an error.
  values?: ExpenseFormValues;
  savedAt?: number;
};

export type ValidExpense = {
  amount: number;
  date: Date;
  note: string | undefined;
  categoryId: string;
  categoryName: string;
};

function text(formData: FormData, name: FieldName): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

// Shared by the create and edit actions so both validate identically: the same
// schema, plus a check that the category belongs to the signed-in user (the id
// comes from the browser, so it cannot be trusted).
export async function parseExpenseSubmission(
  formData: FormData,
  userId: string,
): Promise<
  { ok: true; data: ValidExpense } | { ok: false; state: ExpenseFormState }
> {
  const values: ExpenseFormValues = {
    amount: text(formData, "amount"),
    categoryId: text(formData, "categoryId"),
    date: text(formData, "date"),
    note: text(formData, "note"),
  };

  const parsed = expenseSchema.safeParse(values);
  if (!parsed.success) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: z.flattenError(parsed.error).fieldErrors,
        values,
      },
    };
  }

  const category = await db.category.findFirst({
    where: { id: parsed.data.categoryId, userId },
    select: { id: true, name: true },
  });
  if (!category) {
    return {
      ok: false,
      state: {
        status: "error",
        message: "Please fix the highlighted fields.",
        fieldErrors: { categoryId: ["Choose a valid category."] },
        values,
      },
    };
  }

  return {
    ok: true,
    data: {
      amount: parsed.data.amount,
      date: parsed.data.date,
      note: parsed.data.note,
      categoryId: category.id,
      categoryName: category.name,
    },
  };
}
