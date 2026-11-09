import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { paiseToRupeesInput } from "@/lib/money";
import { ExpenseForm } from "@/components/app/expense-form";
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
    <main className="p-4 md:p-8">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Edit expense
        </h1>
        <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Change the details and save.
        </p>
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10">
          <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
            <EditExpenseLoader params={params} />
          </Suspense>
        </div>
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

  return (
    <ExpenseForm
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
  );
}
