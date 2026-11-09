import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { ImportFlow } from "@/components/app/import-flow";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { ensureDefaultCategories } from "@/lib/categories";
import { db } from "@/lib/db";
import { button } from "@/lib/ui";

export const metadata = {
  title: "Import expenses | Expense Tracker",
};

export default function ImportPage() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title="Import expenses"
          description="Upload a bank or UPI statement, check the categories, then save."
          actions={
            <Link href="/expenses" className={button("secondary")}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to expenses
            </Link>
          }
        />
        <Suspense
          fallback={
            <div className="grid gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <Skeleton className="h-[360px] rounded-2xl" />
              <Skeleton className="h-[360px] rounded-2xl" />
            </div>
          }
        >
          <ImportContent />
        </Suspense>
      </div>
    </main>
  );
}

// Session and categories are read at request time, scoped to the signed-in user.
async function ImportContent() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/expenses/import");
  const userId = session.user.id;

  await ensureDefaultCategories(userId);
  const categories = await db.category.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return <ImportFlow categories={categories} />;
}
