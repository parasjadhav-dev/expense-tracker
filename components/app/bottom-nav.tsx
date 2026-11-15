"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Ellipsis, LayoutDashboard, List, Plus, Wallet, X } from "lucide-react";
import { NAV_ITEMS } from "./nav-items";

// The phone navigation: a bar at the bottom of the screen, where a thumb reaches,
// with the four places used most and a raised "+" in the middle to add an
// expense. Everything else (Recurring, Account, log out) is under "More".
// Hidden from tablet width up, where the sidebar takes over.

const MAIN = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expenses", label: "Expenses", icon: List },
  { href: "/budgets", label: "Budgets", icon: Wallet },
] as const;
const ADD_HREF = "/expenses/new";
const MAIN_HREFS: string[] = [...MAIN.map((item) => item.href), ADD_HREF];

const tab =
  "flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors";
const tabIdle =
  "text-zinc-500 active:text-zinc-950 dark:text-zinc-400 dark:active:text-zinc-50";
const tabActive = "text-[#1c5cab] dark:text-[#8db9f0]";

export function BottomNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sheetRef = useRef<HTMLDialogElement>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // The longest matching link wins, so /expenses/new is "Add", not "Expenses".
  const activeHref = NAV_ITEMS.filter(
    ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const moreActive = activeHref !== undefined && !MAIN_HREFS.includes(activeHref);
  const moreItems = NAV_ITEMS.filter((item) => !MAIN_HREFS.includes(item.href));

  // Going to another page closes the sheet.
  useEffect(() => {
    sheetRef.current?.close();
  }, [pathname]);

  return (
    <>
      <nav
        aria-label="Main mobile"
        data-testid="bottom-nav"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
      >
        <ul className="mx-auto grid max-w-md grid-cols-5 items-end">
          {MAIN.slice(0, 2).map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={activeHref === href ? "page" : undefined}
                className={`${tab} ${activeHref === href ? tabActive : tabIdle}`}
              >
                <Icon className="size-6" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}

          <li className="flex justify-center">
            <Link
              href={ADD_HREF}
              aria-label="Add expense"
              aria-current={activeHref === ADD_HREF ? "page" : undefined}
              data-testid="bottom-add"
              className="-translate-y-4 flex size-14 items-center justify-center rounded-full bg-[#2a78d6] text-white shadow-lg ring-4 ring-white transition-colors active:bg-[#1c5cab] dark:bg-[#3987e5] dark:ring-zinc-950"
            >
              <Plus className="size-7" aria-hidden="true" />
            </Link>
          </li>

          {MAIN.slice(2).map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={activeHref === href ? "page" : undefined}
                className={`${tab} ${activeHref === href ? tabActive : tabIdle}`}
              >
                <Icon className="size-6" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}

          <li>
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              data-testid="bottom-more"
              onClick={() => {
                sheetRef.current?.showModal();
                setSheetOpen(true);
              }}
              className={`${tab} w-full ${moreActive || sheetOpen ? tabActive : tabIdle}`}
            >
              <Ellipsis className="size-6" aria-hidden="true" />
              More
            </button>
          </li>
        </ul>
      </nav>

      {/* A native <dialog>: focus stays inside, Escape closes it, and the page
          behind cannot be tapped. It slides up from the bottom edge. */}
      <dialog
        ref={sheetRef}
        aria-label="More"
        data-testid="more-sheet"
        onClose={() => setSheetOpen(false)}
        onCancel={() => setSheetOpen(false)}
        onClick={(event) => {
          // Only the backdrop has the dialog itself as its target.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="fixed inset-x-0 bottom-0 top-auto m-0 w-full max-w-none rounded-t-2xl bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/50 backdrop:backdrop-blur-[2px] md:hidden dark:bg-zinc-900 dark:text-zinc-50"
      >
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <div className="mx-auto mb-1 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight">More</h2>
            <button
              type="button"
              aria-label="Close"
              onClick={() => sheetRef.current?.close()}
              className="inline-flex size-11 items-center justify-center rounded-lg text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <X className="size-5" aria-hidden="true" />
            </button>
          </div>

          <ul className="flex flex-col gap-1">
            {moreItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={activeHref === href ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium ${
                    activeHref === href
                      ? "bg-[#2a78d6]/10 text-[#1c5cab] dark:bg-[#3987e5]/15 dark:text-[#8db9f0]"
                      : "text-zinc-800 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-3">{children}</div>
        </div>
      </dialog>
    </>
  );
}
