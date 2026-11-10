import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ChangePasswordForm } from "@/components/app/change-password-form";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { auth } from "@/lib/auth";
import { card } from "@/lib/ui";

export const metadata = {
  title: "Account | Expense Tracker",
};

export default function SettingsPage() {
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          title="Account"
          description="Your sign-in details and password."
        />
        <Suspense
          fallback={
            <div className="grid gap-4 md:gap-5 lg:grid-cols-2">
              <Skeleton className="h-48 rounded-2xl" />
              <Skeleton className="h-[420px] rounded-2xl" />
            </div>
          }
        >
          <SettingsContent />
        </Suspense>
      </div>
    </main>
  );
}

// Session is read at request time, scoped to the signed-in user.
async function SettingsContent() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/settings");
  const { name, email } = session.user;

  return (
    <div className="grid items-start gap-4 md:gap-5 lg:grid-cols-2">
      <section className={`${card} p-6`} aria-labelledby="account-details">
        <h2
          id="account-details"
          className="mb-4 text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Your account
        </h2>
        <dl className="flex flex-col gap-4 text-sm">
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
            <dd className="mt-0.5 font-medium text-zinc-950 dark:text-zinc-50">
              {name || "Not set"}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
            <dd
              className="mt-0.5 break-all font-medium text-zinc-950 dark:text-zinc-50"
              data-testid="account-email"
            >
              {email}
            </dd>
          </div>
        </dl>
      </section>

      <section className={`${card} p-6`} aria-labelledby="change-password">
        <h2
          id="change-password"
          className="mb-1 text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Change password
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          You stay logged in on this device. Other devices stay logged in until
          their session ends.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
