import { Prisma } from "@/src/generated/prisma/client";
import { db } from "@/lib/db";

// An "overall" budget is the row with categoryId = null: one per user per month.
// The database enforces that with a partial unique index
// (Budget_overall_userId_month_key).

export async function getOverallBudget(
  userId: string,
  month: string,
): Promise<{ amount: number } | null> {
  return db.budget.findFirst({
    where: { userId, month, categoryId: null },
    select: { amount: true },
  });
}

// Saved category budgets for a month, as { categoryId: paise }.
export async function getCategoryBudgets(
  userId: string,
  month: string,
): Promise<Record<string, number>> {
  const rows = await db.budget.findMany({
    where: { userId, month, categoryId: { not: null } },
    select: { categoryId: true, amount: true },
  });
  return Object.fromEntries(
    rows.flatMap((row) =>
      row.categoryId ? [[row.categoryId, row.amount] as const] : [],
    ),
  );
}

// Sets (amount) or clears (null) the budget of each listed category for one
// month, all in a single transaction. Callers must pass only categories that
// belong to userId. Unlike overall budgets, (userId, categoryId, month) is a
// normal unique key because categoryId is never null here, so upsert is atomic.
export async function saveCategoryBudgets(options: {
  userId: string;
  month: string;
  entries: { categoryId: string; amount: number | null }[];
}): Promise<void> {
  const { userId, month, entries } = options;
  await db.$transaction(
    entries.map(({ categoryId, amount }) =>
      amount === null
        ? db.budget.deleteMany({ where: { userId, month, categoryId } })
        : db.budget.upsert({
            where: { userId_categoryId_month: { userId, categoryId, month } },
            create: { userId, month, categoryId, amount },
            update: { amount },
          }),
    ),
  );
}

// Prisma cannot upsert on a partial unique index, so this updates first and
// creates only when nothing matched. If two requests race to create, the unique
// index rejects the second one and it falls back to an update.
export async function saveOverallBudget(options: {
  userId: string;
  month: string;
  amount: number;
}): Promise<"created" | "updated"> {
  const { userId, month, amount } = options;
  const update = () =>
    db.budget.updateMany({
      where: { userId, month, categoryId: null },
      data: { amount },
    });

  if ((await update()).count > 0) return "updated";

  try {
    await db.budget.create({
      data: { userId, month, amount, categoryId: null },
    });
    return "created";
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      await update();
      return "updated";
    }
    throw error;
  }
}
