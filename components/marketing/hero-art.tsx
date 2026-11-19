import { BellRing, Clapperboard, House, Plane, ShoppingBag, Utensils, type LucideIcon } from "lucide-react";
import { DashboardPreview } from "./dashboard-preview";

// The landing page picture: the dashboard preview on a soft teal blob, with a
// budget alert and a few category pills floating around it. Decorative only.
// Category colours are written out (the app's --cat-N variables change with the
// theme, and these float over a light blob in both themes).
const PILLS: { name: string; color: string; icon: LucideIcon; position: string }[] = [
  { name: "Rent", color: "#6d28d9", icon: House, position: "left-4 -top-4 rotate-3" },
  { name: "Food", color: "#ac3a0c", icon: Utensils, position: "right-8 -top-5 -rotate-3" },
  { name: "Shopping", color: "#b61759", icon: ShoppingBag, position: "-right-2 top-[4.25rem] rotate-6 sm:-right-6" },
  { name: "Travel", color: "#03659b", icon: Plane, position: "left-52 -bottom-5 rotate-3" },
  { name: "Movies", color: "#a21caf", icon: Clapperboard, position: "right-8 -bottom-6 -rotate-6 max-sm:hidden" },
];

export function HeroArt({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative ${className}`}>
      <svg
        viewBox="0 0 400 400"
        className="absolute -inset-6 -z-0 size-[calc(100%+3rem)]"
        fill="none"
      >
        <path
          d="M60 190c-24-90 56-160 140-168 84-8 148 38 166 116 18 80-30 150-120 178-92 28-162-6-186-126Z"
          className="fill-[#0f766e]/10 dark:fill-[#2dd4bf]/10"
        />
        <circle cx="352" cy="64" r="11" className="fill-amber-300 dark:fill-amber-400/80" />
        <circle cx="352" cy="64" r="5" className="fill-amber-100 dark:fill-amber-200/60" />
        <circle cx="38" cy="340" r="9" className="fill-amber-300 dark:fill-amber-400/80" />
        <circle cx="38" cy="340" r="4" className="fill-amber-100 dark:fill-amber-200/60" />
        <path
          d="M60 52v14M53 59h14"
          strokeWidth="3"
          strokeLinecap="round"
          className="stroke-[#0f766e]/50 dark:stroke-[#2dd4bf]/60"
        />
      </svg>

      <DashboardPreview className="relative" />

      {PILLS.map(({ name, color, icon: Icon, position }) => (
        <span
          key={name}
          className={`absolute inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-1.5 pr-3 text-xs font-semibold shadow-lg ring-1 ring-zinc-950/5 ${position}`}
          style={{ color }}
        >
          <span
            className="grid size-5 place-items-center rounded-full"
            style={{ background: `${color}1f` }}
          >
            <Icon className="size-3" />
          </span>
          {name}
        </span>
      ))}

      <div className="absolute -bottom-9 left-3 flex items-center gap-2.5 rounded-xl bg-white p-2.5 pr-4 text-zinc-950 shadow-xl ring-1 ring-zinc-950/5 sm:-left-5">
        <span className="grid size-8 place-items-center rounded-lg bg-amber-100 text-amber-700">
          <BellRing className="size-4" />
        </span>
        <div>
          <p className="text-xs font-semibold">Food is at 82%</p>
          <p className="text-[11px] text-zinc-600">Close to its limit</p>
        </div>
      </div>
    </div>
  );
}
