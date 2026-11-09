import { Wallet } from "lucide-react";

// The brand mark: a blue tile with a wallet, and the product name.
export function Logo({
  tone = "default",
}: {
  tone?: "default" | "light";
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`grid size-8 shrink-0 place-items-center rounded-lg shadow-sm ${
          tone === "light"
            ? "bg-white/15 text-white ring-1 ring-white/25"
            : "bg-gradient-to-br from-[#3987e5] to-[#1c5cab] text-white"
        }`}
      >
        <Wallet className="size-[18px]" />
      </span>
      <span
        className={`text-[15px] font-semibold tracking-tight ${
          tone === "light" ? "text-white" : "text-zinc-950 dark:text-zinc-50"
        }`}
      >
        Expense Tracker
      </span>
    </span>
  );
}
