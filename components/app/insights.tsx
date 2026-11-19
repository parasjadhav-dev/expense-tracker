import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleCheck,
  Gauge,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { Insight, InsightTone } from "@/lib/insights";
import { card } from "@/lib/ui";

// Colour is never the only signal: each insight also has its own icon and its
// sentence says "more", "less", "over" or "under".
const TONE: Record<InsightTone, { chip: string; accent: string }> = {
  good: {
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    accent: "before:bg-emerald-500",
  },
  warn: {
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    accent: "before:bg-amber-500",
  },
  bad: {
    chip: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
    accent: "before:bg-red-500",
  },
  neutral: {
    chip: "bg-[#0f766e]/10 text-[#0f766e] dark:bg-[#2dd4bf]/15 dark:text-[#5eead4]",
    accent: "before:bg-[#0f766e] dark:before:bg-[#2dd4bf]",
  },
};

function iconFor(insight: Insight): LucideIcon {
  switch (insight.kind) {
    case "projection":
      if (insight.tone === "bad") return TriangleAlert;
      return insight.tone === "good" ? CircleCheck : Gauge;
    case "pace":
      if (insight.tone === "neutral") return Minus;
      return insight.tone === "good" ? TrendingDown : TrendingUp;
    case "mover":
      return insight.tone === "good" ? ArrowDownRight : ArrowUpRight;
  }
}

// A few plain-language observations about the month, above the charts: the
// forecast first, because it is the one you can act on.
export function Insights({ insights, label }: { insights: Insight[]; label: string }) {
  if (insights.length === 0) return null;

  return (
    <section aria-labelledby="insights-heading" data-testid="insights">
      <h2
        id="insights-heading"
        className="mb-2.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
      >
        <Sparkles className="size-3.5" aria-hidden="true" />
        Insights · {label}
      </h2>
      <ul className="grid gap-3 md:grid-cols-3 md:gap-4">
        {insights.map((insight) => {
          const Icon = iconFor(insight);
          const tone = TONE[insight.tone];
          return (
            <li
              key={insight.id}
              data-testid="insight"
              data-tone={insight.tone}
              className={`${card} relative flex items-start gap-3 overflow-hidden p-4 pl-5 before:absolute before:inset-y-0 before:left-0 before:w-1 ${tone.accent}`}
            >
              <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone.chip}`}>
                <Icon className="size-[18px]" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug tracking-tight text-zinc-950 dark:text-zinc-50">
                  {insight.title}
                </p>
                {insight.detail ? (
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {insight.detail}
                  </p>
                ) : null}
                {insight.href ? (
                  <Link
                    href={insight.href}
                    className="mt-1.5 inline-block text-xs font-medium text-[#0f766e] underline-offset-4 hover:underline dark:text-[#5eead4]"
                  >
                    {insight.hrefLabel}
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
