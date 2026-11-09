import { BarChart3, BellRing, Target } from "lucide-react";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Logo } from "@/components/ui/logo";

const POINTS = [
  { icon: Target, text: "Budgets for the month and for each category" },
  { icon: BellRing, text: "Warnings before you overspend, not after" },
  { icon: BarChart3, text: "A clear daily number you can safely spend" },
];

// Split layout for login and sign-up: a brand panel on laptops, and just the
// form (with a small logo above it) on phones, so the page is never a lone card
// in an empty screen.
export function AuthShell({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen flex-1 bg-white lg:grid-cols-[1.05fr_1fr] dark:bg-zinc-950">
      <div
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#164a8c] via-[#2a78d6] to-[#5598e7] p-12 text-white lg:flex"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-96 rounded-full bg-[#164a8c]/40" />

        <div className="relative">
          <Logo tone="light" />
        </div>

        <div className="relative">
          <p className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Know what you can spend today.
          </p>
          <ul className="mt-8 flex max-w-md flex-col gap-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-[15px] text-white/90">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <DashboardPreview className="relative max-w-md" />
      </div>

      <div className="flex flex-col justify-center px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </p>
          <div className="mt-8">{children}</div>
          <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
            {footer}
          </div>
        </div>
      </div>
    </main>
  );
}
