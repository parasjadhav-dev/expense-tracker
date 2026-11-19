import { CalendarClock, House, Plane, Utensils, type LucideIcon } from "lucide-react";

// A small picture of the dashboard for the landing page and the sign-in panel.
// The numbers are made up and the card says so.
// The preview always sits on a white card, so these are the light-theme category
// colours written out (the app's --cat-N variables turn pale in dark mode).
const SAMPLE_BARS: { name: string; value: string; width: string; color: string; icon: LucideIcon }[] = [
  { name: "Rent", value: "₹18,000", width: "100%", color: "#6d28d9", icon: House },
  { name: "Food", value: "₹6,420", width: "36%", color: "#c2410c", icon: Utensils },
  { name: "Travel", value: "₹3,150", width: "18%", color: "#0369a1", icon: Plane },
];

const SAMPLE_TREND = "0,38 40,30 80,34 120,18 160,24 200,8";

export function DashboardPreview({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`rounded-2xl bg-white p-5 text-zinc-950 shadow-2xl shadow-[#0b3b37]/25 ring-1 ring-zinc-950/5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Safe to spend per day
        </p>
        <span className="grid size-8 place-items-center rounded-lg bg-[#0f766e]/10 text-[#0f766e]">
          <CalendarClock className="size-4" />
        </span>
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-tight">₹1,184.00</p>
      <p className="mt-1 text-xs text-zinc-500">₹26,048 left over 22 days</p>

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-zinc-700">Overall budget</span>
          <span className="tabular-nums text-zinc-500">₹18,952 of ₹45,000</span>
        </div>
        <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full w-[42%] rounded-full bg-emerald-500" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1.2fr_1fr] gap-4">
        <div className="flex flex-col gap-2.5">
          {SAMPLE_BARS.map((bar) => (
            <div key={bar.name} className="flex items-center gap-2 text-xs">
              <span
                className="grid size-5 shrink-0 place-items-center rounded-md"
                style={{ color: bar.color, background: `${bar.color}1f` }}
              >
                <bar.icon className="size-3" />
              </span>
              <span className="w-9 shrink-0 text-zinc-500">{bar.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-r-full">
                <div className="h-full rounded-r" style={{ width: bar.width, background: bar.color }} />
              </div>
              <span className="w-14 shrink-0 text-right tabular-nums text-zinc-700">
                {bar.value}
              </span>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-zinc-50 p-3">
          <p className="text-[11px] font-medium text-zinc-500">Last 6 months</p>
          <svg viewBox="0 0 200 48" className="mt-1 h-12 w-full" fill="none">
            <polygon points={`${SAMPLE_TREND} 200,48 0,48`} fill="#0f766e" fillOpacity="0.1" />
            <polyline
              points={SAMPLE_TREND}
              stroke="#0f766e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="200" cy="8" r="4" fill="#fff" stroke="#0f766e" strokeWidth="2" />
          </svg>
        </div>
      </div>

      <p className="mt-4 text-[11px] text-zinc-400">Sample data</p>
    </div>
  );
}
