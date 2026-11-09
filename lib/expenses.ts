import { db } from "@/lib/db";
import { monthRange } from "@/lib/expense-filters";

export const EXPENSE_LIST_LIMIT = 100;

export type ExpenseListItem = {
  id: string;
  amount: number;
  date: Date;
  note: string | null;
  categoryName: string;
};

export type ExpenseList = {
  items: ExpenseListItem[];
  // Totals cover every matching expense, not only the rows shown.
  totalPaise: number;
  count: number;
  truncated: boolean;
};

// Every query is scoped to userId. Callers pass the id from the session, never
// from the request.
export async function listExpenses(options: {
  userId: string;
  month: string | null;
  categoryId: string | null;
}): Promise<ExpenseList> {
  const where = {
    userId: options.userId,
    ...(options.month ? { date: monthRange(options.month) } : {}),
    ...(options.categoryId ? { categoryId: options.categoryId } : {}),
  };

  const [rows, totals] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: EXPENSE_LIST_LIMIT,
      select: {
        id: true,
        amount: true,
        date: true,
        note: true,
        category: { select: { name: true } },
      },
    }),
    db.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const count = totals._count._all;
  return {
    items: rows.map((row) => ({
      id: row.id,
      amount: row.amount,
      date: row.date,
      note: row.note,
      categoryName: row.category.name,
    })),
    totalPaise: totals._sum.amount ?? 0,
    count,
    truncated: count > rows.length,
  };
}
