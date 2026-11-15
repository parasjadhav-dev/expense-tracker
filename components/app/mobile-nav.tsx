import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Phone-width top bar: the logo and the dark-mode switch. Navigation lives in
// the bottom bar (see bottom-nav.tsx), where a thumb can reach it.
export function MobileNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/90 backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" aria-label="Expense Tracker home" className="-my-2 inline-flex py-2">
          <Logo />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
