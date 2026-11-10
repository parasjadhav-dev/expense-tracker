"use client";

import { Moon, Sun } from "lucide-react";

// Light/dark switch. Both icons are always rendered and CSS picks one from the
// `dark` class on <html>, so the server and client markup match (no hydration
// flicker). The choice is saved in localStorage; with nothing saved the app
// follows the system setting (see THEME_SCRIPT in app/layout.tsx).
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const dark = !root.classList.contains("dark");
    root.classList.toggle("dark", dark);
    root.style.colorScheme = dark ? "dark" : "light";
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Storage can be blocked; the switch still works for this visit.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      data-testid="theme-toggle"
      className={`inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2a78d6]/50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 ${className}`}
    >
      <Moon className="size-[18px] dark:hidden" aria-hidden="true" />
      <Sun className="hidden size-[18px] dark:block" aria-hidden="true" />
    </button>
  );
}
