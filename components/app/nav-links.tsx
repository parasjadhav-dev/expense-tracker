"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

export const NAV_LINK_BASE =
  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";
export const NAV_LINK_IDLE =
  "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50";
export const NAV_LINK_ACTIVE =
  "bg-[#2a78d6]/10 text-[#1c5cab] dark:bg-[#3987e5]/15 dark:text-[#8db9f0]";

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
            className={`${NAV_LINK_BASE} ${active ? NAV_LINK_ACTIVE : NAV_LINK_IDLE}`}
          >
            <Icon
              className={`size-[18px] ${active ? "" : "text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-500"}`}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
