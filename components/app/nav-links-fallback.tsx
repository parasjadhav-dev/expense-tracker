import Link from "next/link";
import { NAV_ITEMS } from "./nav-items";

// Shown while NavLinks waits for the current URL, so the sidebar does not jump.
// Same links, no active highlight. (The classes match nav-links.tsx.)
export function NavLinksFallback() {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-50"
        >
          <Icon
            className="size-[18px] text-zinc-400 dark:text-zinc-500"
            aria-hidden="true"
          />
          {label}
        </Link>
      ))}
    </nav>
  );
}
