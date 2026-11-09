import { revalidatePath } from "next/cache";

// Shown when a database write fails for a reason the user cannot fix (outage,
// timeout). Server details are logged, never sent to the browser.
export const SAVE_FAILED_MESSAGE =
  "Something went wrong on our side and nothing was saved. Please try again.";

export const DELETE_FAILED_MESSAGE =
  "Something went wrong on our side and the expense was not deleted. Please try again.";

export function logActionError(action: string, error: unknown): void {
  console.error(`[${action}] failed:`, error);
}

// Every page that shows expenses or totals built from them.
export function revalidateExpensePages(): void {
  for (const path of ["/dashboard", "/expenses", "/expenses/new", "/budgets"]) {
    revalidatePath(path);
  }
}

// The expense form's fields as typed, so a failed save can refill the form.
export function expenseFormValues(formData: FormData) {
  const read = (name: string) => {
    const value = formData.get(name);
    return typeof value === "string" ? value : "";
  };
  return {
    amount: read("amount"),
    categoryId: read("categoryId"),
    date: read("date"),
    note: read("note"),
  };
}
