import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "@/lib/auth";

export const metadata = {
  title: "Dashboard | Expense Tracker",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <Shell>
          <p className="text-sm text-zinc-500">Loading...</p>
        </Shell>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

// Request-time session check on the server. It does not rely on proxy.ts alone.
async function DashboardContent() {
  await connection();
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <Shell>
      <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
        Dashboard
      </h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Welcome, {session.user.name ?? session.user.email}. The budget dashboard
        is built in Week 2.
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 w-full flex-col items-center justify-center bg-zinc-50 px-4 py-16 font-sans dark:bg-black">
      <div className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-sm dark:bg-zinc-950 dark:ring-1 dark:ring-white/10">
        {children}
      </div>
    </main>
  );
}
