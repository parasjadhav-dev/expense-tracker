import { summarizeBudgets } from "@/lib/budget";
import { getCategoryBudgets, getOverallBudget } from "@/lib/budgets";
import { db } from "@/lib/db";
import { getMonthSpendByCategory } from "@/lib/expenses";

// Everything the budget screens need for one month, loaded together and scoped
// to the user. userId must come from the session, never from the request.
export async function loadMonthBudgets(userId: string, month: string) {
  const [overallBudget, categories, categoryBudgets, spending] =
    await Promise.all([
      getOverallBudget(userId, month),
      db.category.findMany({
        where: { userId },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      getCategoryBudgets(userId, month),
      getMonthSpendByCategory(userId, month),
    ]);

  const summary = summarizeBudgets({
    overallBudget: overallBudget?.amount,
    categoryBudgets,
    categories,
    expenses: spending,
  });

  return { overallBudget, categories, categoryBudgets, summary };
}
