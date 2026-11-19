import { getCategoryStyle } from "@/lib/category-style";

// A coloured tile with the category's icon. Decorative: the name is always
// written next to it, so colour and icon are never the only signal.
export function CategoryBadge({
  name,
  className = "size-9",
}: {
  name: string;
  className?: string;
}) {
  const { icon: Icon, color, tint } = getCategoryStyle(name);
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-lg ${className}`}
      style={{ color, background: tint }}
    >
      <Icon className="size-[55%]" />
    </span>
  );
}

// The category as a small pill: icon and name on a tint of its colour.
export function CategoryPill({ name }: { name: string }) {
  const { icon: Icon, color, tint } = getCategoryStyle(name);
  return (
    <span
      className="inline-flex max-w-full items-center gap-1.5 rounded-full py-0.5 pl-2 pr-2.5 text-xs font-medium"
      style={{ color, background: tint }}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{name}</span>
    </span>
  );
}
