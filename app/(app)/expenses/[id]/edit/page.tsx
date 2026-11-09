import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ExpenseForm } from "@/components/app/expense-form";
import { RecentExpenses } from "@/components/app/recent-expenses";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { todayInAppZone } from "@/lib/time";
import { db } from "@/lib/db";
import { getRecentExpenses } from "@/lib/expenses";
import { paiseToRupeesInput } from "@/lib/money";
import { card } from "@/lib/ui";
import { updateExpense } from "./actions";

export const metadata = {
  title: "Edit expense | Expense Tracker",
};

export default function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title="Edit expense"
          description="Change the details and save."
        />
        <Suspense
          fallback={
            <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
              <Skeleton className="h-[420px] rounded-2xl" />
              <Skeleton className="h-[420px] rounded-2xl" />
            </div>
          }
        >
          <EditExpenseLoader params={params} />
        </Suspense>
      </div>
    </main>
  );
}

// Looks the expense up by id AND owner, so another user's id is a 404, not a leak.
async function EditExpenseLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect(`/login?callbackUrl=/expenses/${id}/edit`);
  const userId = session.user.id;

  const [expense, categories] = await Promise.all([
    db.expense.findFirst({ where: { id, userId } }),
    db.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  if (!expense) notFound();

  const categoryName =
    categories.find((category) => category.id === expense.categoryId)?.name ??
    "this category";
  // Context beside the form: the other expenses in the same category.
  const others = await getRecentExpenses(userId, {
    categoryId: expense.categoryId,
    excludeId: expense.id,
    limit: 6,
  });

  return (
    <div className="grid items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
      <div className={`${card} p-6`}>
        <ExpenseForm
          today={todayInAppZone()}
          categories={categories}
          action={updateExpense.bind(null, expense.id)}
          initialValues={{
            amount: paiseToRupeesInput(expense.amount),
            categoryId: expense.categoryId,
            date: expense.date.toISOString().slice(0, 10),
            note: expense.note ?? "",
          }}
          submitLabel="Save changes"
          pendingLabel="Saving..."
          cancelHref={`/expenses?month=${expense.date.toISOString().slice(0, 7)}`}
        />
      </div>
      <RecentExpenses
        id="other-in-category"
        title={`Other ${categoryName} expenses`}
        items={others}
        emptyText={`No other ${categoryName} expenses yet.`}
        footerHref={`/expenses?month=&category=${expense.categoryId}`}
        footerLabel="View all"
      />
    </div>
  );
}
