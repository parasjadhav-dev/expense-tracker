import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { button, link } from "@/lib/ui";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata = {
  title: "Reset password | Expense Tracker",
  // The URL carries a secret token: keep it out of search engines and do not
  // send it on as a referrer.
  robots: { index: false },
  referrer: "no-referrer",
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <AuthShell
      title="Choose a new password"
      description="Pick a password you have not used before."
      footer={
        <>
          Back to{" "}
          <Link href="/login" className={link}>
            Log in
          </Link>
        </>
      }
    >
      <Suspense
        fallback={
          <div className="flex flex-col gap-4">
            <Skeleton className="h-[72px]" />
            <Skeleton className="h-[72px]" />
            <Skeleton className="mt-2 h-11" />
          </div>
        }
      >
        <ResetContent searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function ResetContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="flex flex-col items-start gap-4" data-testid="reset-missing">
        <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900">
          This reset link is incomplete. Request a new one.
        </p>
        <Link href="/forgot-password" className={`${button("primary")} h-11 w-full`}>
          Get a new link
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm token={token} />;
}
