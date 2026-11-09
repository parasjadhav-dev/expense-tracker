import { connection } from "next/server";
import { CalendarDays } from "lucide-react";
import { daysInMonth } from "@/lib/budget";
import { formatMonth } from "@/lib/expense-filters";
import { todayInAppZone } from "@/lib/time";
import { iconChip } from "@/lib/ui";

// A small "where are we in the month" card for the sidebar. Reads the clock, so
// render it inside <Suspense>.
export async function SidebarDate() {
  await connection();
  const today = todayInAppZone();
  const month = today.slice(0, 7);
  const day = Number(today.slice(8));
  const left = daysInMonth(month) - day + 1;

  const weekday = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${today}T00:00:00.000Z`));

  return (
    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 ring-1 ring-zinc-950/[0.04] dark:bg-zinc-900 dark:ring-white/10">
      <span className={iconChip}>
        <CalendarDays className="size-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {weekday}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          {left} {left === 1 ? "day" : "days"} left in {formatMonth(month).split(" ")[0]}
        </p>
      </div>
    </div>
  );
}
