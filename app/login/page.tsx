import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { safeCallbackUrl } from "@/lib/redirect";
import { link } from "@/lib/ui";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Log in | Expense Tracker",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <AuthShell
      title="Welcome back"
      description="Log in to see your budgets and spending."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className={link}>
            Create account
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
        <LoginFormWithParams searchParams={searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginFormWithParams({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  return <LoginForm callbackUrl={safeCallbackUrl(callbackUrl)} />;
}
