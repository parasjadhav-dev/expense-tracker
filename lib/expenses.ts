import { db } from "@/lib/db";
import { monthRange } from "@/lib/expense-filters";
import {
  DEFAULT_SORT,
  PAGE_SIZE,
  clampPage,
  orderByFor,
  pageCount,
  searchConditions,
  type SortKey,
} from "@/lib/expense-query";

import type { SpendEntry } from "@/lib/budget";

// Total spent per category in one month, in the shape the budget maths expects.
// Categories with no expenses are absent. Scoped to userId, which callers must
// take from the session.
export async function getMonthSpendByCategory(
  userId: string,
  month: string,
): Promise<SpendEntry[]> {
  const rows = await db.expense.groupBy({
    by: ["categoryId"],
    where: { userId, date: monthRange(month) },
    _sum: { amount: true },
  });
  return rows.map((row) => ({
    categoryId: row.categoryId,
    amount: row._sum.amount ?? 0,
  }));
}

// Total spent per category between two dates (from gte, up to but not including
// lt). Used to compare a month with the same days of the month before. Scoped to
// userId, which callers must take from the session.
export async function getSpendByCategoryBetween(
  userId: string,
  range: { gte: Date; lt: Date },
): Promise<SpendEntry[]> {
  const rows = await db.expense.groupBy({
    by: ["categoryId"],
    where: { userId, date: { gte: range.gte, lt: range.lt } },
    _sum: { amount: true },
  });
  return rows.map((row) => ({
    categoryId: row.categoryId,
    amount: row._sum.amount ?? 0,
  }));
}

export type ExpenseListItem = {
  id: string;
  amount: number;
  date: Date;
  note: string | null;
  categoryName: string;
};

export type ExpenseList = {
  items: ExpenseListItem[];
  // Totals cover every matching expense, not only the rows on this page.
  totalPaise: number;
  count: number;
  // The page actually shown (a page past the end becomes the last page).
  page: number;
  pageCount: number;
};

// Every query is scoped to userId. Callers pass the id from the session, never
// from the request.
export async function listExpenses(options: {
  userId: string;
  month: string | null;
  categoryId: string | null;
  q?: string;
  sort?: SortKey;
  page?: number;
}): Promise<ExpenseList> {
  const conditions = searchConditions(options.q ?? "");
  const where = {
    userId: options.userId,
    ...(options.month ? { date: monthRange(options.month) } : {}),
    ...(options.categoryId ? { categoryId: options.categoryId } : {}),
    ...(conditions.length > 0 ? { OR: conditions } : {}),
  };

  const totals = await db.expense.aggregate({
    where,
    _sum: { amount: true },
    _count: { _all: true },
  });
  const count = totals._count._all;
  const page = clampPage(options.page ?? 1, count);

  const rows = await db.expense.findMany({
    where,
    orderBy: orderByFor(options.sort ?? DEFAULT_SORT),
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      amount: true,
      date: true,
      note: true,
      category: { select: { name: true } },
    },
  });

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
    page,
    pageCount: pageCount(count),
  };
}

// Total spent on each calendar day between two months (inclusive), as plain
// "YYYY-MM-DD" strings. Grouping by day keeps this to at most ~190 rows for six
// months; the monthly totals are added up from these by lib/monthly-trend.ts.
// Scoped to userId, which callers must take from the session.
export async function getSpendingByDay(
  userId: string,
  fromMonth: string,
  toMonth: string,
): Promise<{ date: string; amount: number }[]> {
  const rows = await db.expense.groupBy({
    by: ["date"],
    where: {
      userId,
      date: { gte: monthRange(fromMonth).gte, lt: monthRange(toMonth).lt },
    },
    _sum: { amount: true },
  });
  return rows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    amount: row._sum.amount ?? 0,
  }));
}

// The latest expenses for one user, newest first. Optionally limited to one
// category, and optionally leaving out one expense (used on the edit page, which
// shows the other expenses in the same category). Scoped to userId, which
// callers must take from the session.
export async function getRecentExpenses(
  userId: string,
  options: {
    limit?: number;
    categoryId?: string;
    excludeId?: string;
    month?: string;
  } = {},
): Promise<ExpenseListItem[]> {
  const rows = await db.expense.findMany({
    where: {
      userId,
      ...(options.categoryId ? { categoryId: options.categoryId } : {}),
      ...(options.excludeId ? { id: { not: options.excludeId } } : {}),
      ...(options.month ? { date: monthRange(options.month) } : {}),
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: options.limit ?? 6,
    select: {
      id: true,
      amount: true,
      date: true,
      note: true,
      category: { select: { name: true } },
    },
  });
  return rows.map((row) => ({
    id: row.id,
    amount: row.amount,
    date: row.date,
    note: row.note,
    categoryName: row.category.name,
  }));
}
