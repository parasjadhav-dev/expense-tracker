import Link from "next/link";
import { Suspense } from "react";
import { MobileNav } from "@/components/app/mobile-nav";
import { NavLinks } from "@/components/app/nav-links";
import { NavLinksFallback } from "@/components/app/nav-links-fallback";
import { UserMenu } from "@/components/app/user-menu";

// Shared shell for signed-in pages: a sidebar from tablet width up, and a top
// bar with a menu button on phones. Each page still checks the session itself.
// NavLinks and MobileNav read the current URL, so they sit inside <Suspense>:
// pages with dynamic segments (like /expenses/[id]/edit) cannot be prerendered
// with URL data outside a boundary.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 md:flex-row dark:bg-black">
      <aside className="hidden w-60 shrink-0 flex-col gap-6 border-r border-zinc-200 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <Link
          href="/dashboard"
          className="px-3 text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Expense Tracker
        </Link>
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
        <div className="mt-auto">
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </div>
      </aside>

      <Suspense
        fallback={
          <header className="flex h-14 items-center border-b border-zinc-200 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
            <span className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Expense Tracker
            </span>
          </header>
        }
      >
        <MobileNav>
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </MobileNav>
      </Suspense>

      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
