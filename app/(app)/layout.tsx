import Link from "next/link";
import { Suspense } from "react";
import { MobileNav } from "@/components/app/mobile-nav";
import { NavLinks } from "@/components/app/nav-links";
import { NavLinksFallback } from "@/components/app/nav-links-fallback";
import { SidebarDate } from "@/components/app/sidebar-date";
import { UserMenu } from "@/components/app/user-menu";
import { Logo } from "@/components/ui/logo";

// Shared shell for signed-in pages: a sidebar from tablet width up, and a top
// bar with a menu button on phones. Each page still checks the session itself.
// NavLinks and MobileNav read the current URL, so they sit inside <Suspense>:
// pages with dynamic segments (like /expenses/[id]/edit) cannot be prerendered
// with URL data outside a boundary.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col bg-[#f5f6fa] md:flex-row dark:bg-black">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-6 border-r border-zinc-200/80 bg-white p-4 md:flex dark:border-zinc-800 dark:bg-zinc-950">
        <Link href="/dashboard" aria-label="Expense Tracker home" className="px-2 pt-1">
          <Logo />
        </Link>
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

      <Suspense
        fallback={
          <header className="flex h-14 items-center border-b border-zinc-200 bg-white px-4 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
            <Logo />
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
