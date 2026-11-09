import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BellRing,
  CalendarClock,
  ListChecks,
  PieChart,
  Target,
  type LucideIcon,
} from "lucide-react";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Logo } from "@/components/ui/logo";
import { button, card, iconChip } from "@/lib/ui";

// The public home page. Logged-in visitors never see it: proxy.ts sends them
// straight to the dashboard.
const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Target,
    title: "Budgets that fit your month",
    text: "Set one overall budget and a limit for each category, month by month.",
  },
  {
    icon: BellRing,
    title: "Warnings before you overspend",
    text: "Get a heads-up at 80% of a budget, and a clear alert when you pass it.",
  },
  {
    icon: CalendarClock,
    title: "Your safe daily number",
    text: "See how much you can spend each remaining day without breaking your budget.",
  },
  {
    icon: PieChart,
    title: "See where it goes",
    text: "A ranked breakdown of spending by category, with exact amounts and shares.",
  },
  {
    icon: BarChart3,
    title: "Six months at a glance",
    text: "A monthly trend line shows whether spending is climbing or settling.",
  },
  {
    icon: ListChecks,
    title: "A simple expense log",
    text: "Add, edit and delete expenses, and filter them by month and category.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-[#f5f6fa] dark:bg-black">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" aria-label="Expense Tracker home">
          <Logo />
        </Link>
        <nav aria-label="Account" className="flex items-center gap-2">
          <Link href="/login" className={button("secondary", "sm")}>
            Log in
          </Link>
          <Link href="/sign-up" className={button("primary", "sm")}>
            Create account
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-8 md:px-8 md:pb-24 md:pt-16 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="inline-flex items-center rounded-full bg-[#2a78d6]/10 px-3 py-1 text-xs font-medium text-[#1c5cab] ring-1 ring-[#2a78d6]/15">
              Budget-first expense tracking
            </p>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-950 md:text-5xl dark:text-zinc-50">
              Know exactly what you can spend today.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Track your expenses, set budgets for the month and for each
              category, and get a daily safe-to-spend number that keeps you on
              plan.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className={`${button("primary")} h-11 px-6`}>
                Create account
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/login" className={`${button("secondary")} h-11 px-6`}>
                Log in
              </Link>
            </div>
            <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
              Free to use. Amounts in rupees.
            </p>
          </div>

          <DashboardPreview className="mx-auto w-full max-w-md lg:ml-auto" />
        </section>

        <section
          aria-labelledby="features"
          className="mx-auto w-full max-w-6xl px-5 pb-16 md:px-8 md:pb-24"
        >
          <h2
            id="features"
            className="text-2xl font-semibold tracking-tight text-zinc-950 md:text-3xl dark:text-zinc-50"
          >
            Everything you need to stay on budget
          </h2>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Simple tools that answer the questions that matter: how much have I
            spent, how much is left, and what can I spend today?
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className={`${card} p-5`}>
                <span className={iconChip}>
                  <Icon className="size-[18px]" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                  {title}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {text}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto w-full max-w-6xl px-5 pb-20 md:px-8">
          <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-[#164a8c] via-[#2a78d6] to-[#5598e7] p-8 text-white shadow-lg md:flex-row md:items-center md:p-12">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                Start tracking in a minute
              </h2>
              <p className="mt-2 max-w-lg text-white/85">
                Create an account, add your first expense and set a budget. Your
                dashboard fills in as you go.
              </p>
            </div>
            <Link
              href="/sign-up"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 text-sm font-medium text-[#1c5cab] shadow-sm transition-colors hover:bg-zinc-100"
            >
              Create account
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200/80 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
        Expense Tracker
      </footer>
    </div>
  );
}
