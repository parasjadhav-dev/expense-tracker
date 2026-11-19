import type { LucideIcon } from "lucide-react";

// The picture above an empty state: a soft teal blob, a few coins and sparkles
// around a tile that carries the page's own icon. Purely decorative.
export function EmptyIllustration({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div aria-hidden="true" className="relative h-24 w-32 shrink-0">
      <svg viewBox="0 0 128 96" className="absolute inset-0 size-full" fill="none">
        <path
          d="M18 52c-4-20 12-40 36-42 22-2 32 8 48 14 16 6 26 22 22 38-4 18-24 26-46 26-30 0-56-8-60-36Z"
          className="fill-[#0f766e]/10 dark:fill-[#2dd4bf]/10"
        />
        <circle cx="20" cy="22" r="7" className="fill-amber-300 dark:fill-amber-400/80" />
        <circle cx="20" cy="22" r="3.5" className="fill-amber-100 dark:fill-amber-200/60" />
        <circle cx="112" cy="70" r="9" className="fill-amber-300 dark:fill-amber-400/80" />
        <circle cx="112" cy="70" r="4.5" className="fill-amber-100 dark:fill-amber-200/60" />
        <path
          d="M108 14v10M103 19h10"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="stroke-[#0f766e]/50 dark:stroke-[#2dd4bf]/60"
        />
        <path
          d="M14 74v6M11 77h6"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-[#0f766e]/40 dark:stroke-[#2dd4bf]/50"
        />
        <circle cx="96" cy="16" r="2.5" className="fill-[#0f766e]/40 dark:fill-[#2dd4bf]/50" />
      </svg>
      <span className="absolute left-1/2 top-1/2 grid size-14 -translate-x-1/2 -translate-y-1/2 rotate-[-6deg] place-items-center rounded-2xl bg-gradient-to-br from-[#14b8a6] to-[#0f766e] text-white shadow-lg ring-4 ring-white dark:ring-zinc-950">
        <Icon className="size-7" />
      </span>
    </div>
  );
}

// An empty page or card: a picture, one line that says what is missing, and the
// next step.
export function EmptyState({
  icon,
  title,
  children,
  action,
  className = "py-10",
  testId,
}: {
  icon: LucideIcon;
  title?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center justify-center gap-3 text-center ${className}`}
    >
      <EmptyIllustration icon={icon} />
      {title ? (
        <p className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {title}
        </p>
      ) : null}
      <p
        data-testid={testId}
        className="max-w-[18rem] text-sm text-zinc-600 dark:text-zinc-400"
      >
        {children}
      </p>
      {action}
    </div>
  );
}
