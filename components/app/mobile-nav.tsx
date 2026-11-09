"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { NavLinks } from "./nav-links";

// Phone-width top bar. The menu is tied to the page it was opened on, so it
// closes by itself when the user navigates.
export function MobileNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;

  return (
    <header className="border-b border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href="/dashboard"
          className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          Expense Tracker
        </Link>
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpenOn(open ? null : pathname)}
          className="inline-flex size-10 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {open ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </div>
      {open ? (
        <div
          id="mobile-menu"
          className="flex flex-col gap-4 border-t border-zinc-200 px-4 py-4 dark:border-zinc-800"
        >
          <NavLinks />
          {children}
        </div>
      ) : null}
    </header>
  );
}
