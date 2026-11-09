"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export function NavLinks() {
  const pathname = usePathname();

  // The longest matching link wins, so /expenses/new highlights "Add expense"
  // and not "Expenses" as well.
  const activeHref = NAV_ITEMS.filter(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === activeHref;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors " +
              (active
                ? "bg-zinc-100 text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50"
                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50")
            }
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
