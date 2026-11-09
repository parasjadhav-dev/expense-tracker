import { db } from "@/lib/db";
import { dueExpenses } from "@/lib/recurring";
import { todayInAppZone } from "@/lib/time";

export type RecurringItem = {
  id: string;
  amount: number;
  note: string | null;
  dayOfMonth: number;
  startMonth: string;
  lastGeneratedMonth: string;
  active: boolean;
  categoryName: string;
};

export async function listRecurring(userId: string): Promise<RecurringItem[]> {
  const rows = await db.recurringExpense.findMany({
    where: { userId },
    orderBy: [{ active: "desc" }, { dayOfMonth: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      amount: true,
      note: true,
      dayOfMonth: true,
      startMonth: true,
      lastGeneratedMonth: true,
      active: true,
      category: { select: { name: true } },
    },
  });
  return rows.map(({ category, ...row }) => ({ ...row, categoryName: category.name }));
}

// Creates the expenses that have come due for the user's active recurring items,
// and returns how many it added. It runs when a page that shows spending loads,
// so there is no scheduler to set up: whenever the user next opens the app, the
// months since the last visit are filled in.
//
// Safe to call from several requests at once. Each item first "claims" its new
// months by moving lastGeneratedMonth forward (only one request can win), and the
// unique (recurringId, recurringMonth) index makes a duplicate impossible even if
// that were somehow bypassed. A failure is logged and never breaks the page.
export async function generateDueExpenses(userId: string): Promise<number> {
  try {
    const today = todayInAppZone();
    const items = await db.recurringExpense.findMany({
      where: { userId, active: true },
    });

    let created = 0;
    for (const item of items) {
      const due = dueExpenses({
        startMonth: item.startMonth,
        lastGeneratedMonth: item.lastGeneratedMonth,
        dayOfMonth: item.dayOfMonth,
        today,
      });
      if (due.length === 0) continue;

      created += await db.$transaction(async (tx) => {
        const claimed = await tx.recurringExpense.updateMany({
          where: {
            id: item.id,
            active: true,
            lastGeneratedMonth: item.lastGeneratedMonth,
          },
          data: { lastGeneratedMonth: due[due.length - 1].month },
        });
        if (claimed.count === 0) return 0; // another request got there first

        const result = await tx.expense.createMany({
          data: due.map(({ month, date }) => ({
            userId,
            categoryId: item.categoryId,
            amount: item.amount,
            note: item.note,
            date: new Date(`${date}T00:00:00.000Z`),
            recurringId: item.id,
            recurringMonth: month,
          })),
          skipDuplicates: true,
        });
        return result.count;
      });
    }
    return created;
  } catch (error) {
    console.error("[generateDueExpenses] failed:", error);
    return 0;
  }
}
