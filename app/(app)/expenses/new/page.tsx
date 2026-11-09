import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ExpenseForm } from "@/components/app/expense-form";
import { RecentExpenses } from "@/components/app/recent-expenses";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { todayInAppZone } from "@/lib/time";
import { ensureDefaultCategories } from "@/lib/categories";
import { db } from "@/lib/db";
import { getRecentExpenses } from "@/lib/expenses";
import { card } from "@/lib/ui";
import { createExpense } from "./actions";

export const metadata = {
  title: "Add expense | Expense Tracker",
};

export default function NewExpensePage() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title="Add expense"
          description="Record what you spent and where."
        />
        <Suspense
          fallback={
            <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
              <Skeleton className="h-[420px] rounded-2xl" />
              <Skeleton className="h-[420px] rounded-2xl" />
            </div>
          }
        >
          <NewExpenseContent />
        </Suspense>
      </div>
    </main>
  );
}

// Session, categories and recent expenses are read at request time, scoped to
// the signed-in user.
async function NewExpenseContent() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/expenses/new");
  const userId = session.user.id;

  await ensureDefaultCategories(userId);
  const [categories, recent] = await Promise.all([
    db.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    getRecentExpenses(userId, { limit: 6 }),
  ]);

  return (
    <div className="grid items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
      <div className={`${card} p-6`}>
        <ExpenseForm
          today={todayInAppZone()}
          categories={categories}
          action={createExpense}
          submitLabel="Save expense"
          pendingLabel="Saving..."
        />
      </div>
      <RecentExpenses
        id="recent-added"
        title="Recent expenses"
        items={recent}
        emptyText="Nothing here yet. Your latest expenses will show up here as you add them."
        footerHref="/expenses"
        footerLabel="View all"
      />
    </div>
  );
}
