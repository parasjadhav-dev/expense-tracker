import Link from "next/link";
import { Suspense } from "react";
import { BottomNav } from "@/components/app/bottom-nav";
import { MobileNav } from "@/components/app/mobile-nav";
import { NavLinks } from "@/components/app/nav-links";
import { NavLinksFallback } from "@/components/app/nav-links-fallback";
import { SidebarDate } from "@/components/app/sidebar-date";
import { UserMenu } from "@/components/app/user-menu";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Shared shell for signed-in pages: a sidebar from tablet width up, and on phones
// a slim top bar plus a tab bar at the bottom. Each page still checks the session
// itself. NavLinks and BottomNav read the current URL, so they sit inside <Suspense>:
// pages with dynamic segments (like /expenses/[id]/edit) cannot be prerendered
// with URL data outside a boundary.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-[#f5f6fa] md:flex-row dark:bg-black">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-zinc-200/80 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-2 pr-1">
          <Link href="/dashboard" aria-label="Expense Tracker home" className="px-2 pt-1">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <Suspense fallback={<NavLinksFallback />}>
          <NavLinks />
        </Suspense>
        <div className="mt-auto flex flex-col gap-4">
          <Suspense fallback={null}>
            <SidebarDate />
          </Suspense>
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </div>
      </aside>

      <MobileNav />

      {/* On a phone the bottom bar covers the lowest 4.5rem of the screen, so
          the page keeps that much empty room at its end. */}
      <div className="flex min-w-0 flex-1 flex-col pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>

      {/* Reads the current URL, so it sits inside <Suspense> (see above). */}
      <Suspense fallback={null}>
        <BottomNav>
          <Suspense fallback={null}>
            <UserMenu />
          </Suspense>
        </BottomNav>
      </Suspense>
    </div>
  );
}
