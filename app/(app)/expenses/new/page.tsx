import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ensureDefaultCategories } from "@/lib/categories";
import { ExpenseForm } from "@/components/app/expense-form";
import { createExpense } from "./actions";

export const metadata = {
  title: "Add expense | Expense Tracker",
};

export default function NewExpensePage() {
  return (
    <main className="p-4 md:p-8">
      <div className="mx-auto w-full max-w-lg">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Add expense
        </h1>
        <p className="mt-1 mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Record what you spent and where.
        </p>
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10">
          <Suspense fallback={<p className="text-sm text-zinc-500">Loading...</p>}>
            <ExpenseFormLoader />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

// Session and categories are read at request time, scoped to the signed-in user.
async function ExpenseFormLoader() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/expenses/new");
  const userId = session.user.id;

  await ensureDefaultCategories(userId);
  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <ExpenseForm
      categories={categories}
      action={createExpense}
      submitLabel="Save expense"
      pendingLabel="Saving..."
    />
  );
}
