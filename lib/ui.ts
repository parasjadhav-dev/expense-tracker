// One place for the look of cards, buttons and inputs, so every page matches.
// The accent is the same teal as the chart series (#0f766e); white text on it
// has a 4.6:1 contrast ratio.

export const card =
  "rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,24,40,0.05)] ring-1 ring-zinc-950/[0.06] dark:bg-zinc-950 dark:ring-white/10";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-60";

// 44px tall on phones and tablets (the size fingers can hit reliably), the compact
// sizes from laptop width (lg) up where there is a mouse.
const sizes = {
  md: "h-11 px-4 lg:h-10",
  sm: "h-11 px-4 text-sm lg:h-8 lg:px-3 lg:text-xs",
} as const;

const variants = {
  primary:
    "bg-[#0f766e] text-white shadow-sm hover:bg-[#115e59] focus-visible:ring-[#0f766e]/50 dark:bg-[#0f766e] dark:hover:bg-[#0d9488]",
  secondary:
    "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-50 focus-visible:ring-zinc-400/50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800",
  // A quieter red for buttons that open a confirmation, so a tap is not
  // mistaken for the final "Delete".
  dangerOutline:
    "border border-red-200 bg-white text-red-700 hover:bg-red-50 focus-visible:ring-red-500/40 dark:border-red-900 dark:bg-zinc-900 dark:text-red-300 dark:hover:bg-red-950",
  danger:
    "bg-red-600 text-white shadow-sm hover:bg-red-700 focus-visible:ring-red-500/50",
} as const;

export function button(
  variant: keyof typeof variants = "primary",
  size: keyof typeof sizes = "md",
): string {
  return `${buttonBase} ${sizes[size]} ${variants[variant]}`;
}

export const input =
  "mt-1.5 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-950 outline-none transition placeholder:text-zinc-400 lg:min-h-0 lg:text-sm focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

export const label = "text-sm font-medium text-zinc-900 dark:text-zinc-100";

// Text links and bare text buttons are only about 20px tall. On a phone this adds
// 12px of padding above and below, cancelled by a negative margin so nothing
// moves, which makes a 44px target. From laptop width (lg) up it is off.
export const tapTarget = "-my-3 py-3 lg:my-0 lg:py-0";

// Text link with the accent colour.
export const link =
  "font-medium text-[#0f766e] underline-offset-4 hover:underline dark:text-[#5eead4]";

// Small coloured square behind an icon.
export const iconChip =
  "grid size-9 shrink-0 place-items-center rounded-lg bg-[#0f766e]/10 text-[#0f766e] dark:bg-[#2dd4bf]/15 dark:text-[#5eead4]";
