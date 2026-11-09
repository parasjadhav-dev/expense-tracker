// A pulsing placeholder block, so a page that is still loading holds its shape
// instead of showing a blank gap.
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    // A span set to display:block, not a div: it is also used inside <p>
    // elements (the page header's description), where a div is invalid HTML and
    // causes a hydration error.
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-lg bg-zinc-200/80 dark:bg-zinc-800 ${className}`}
    />
  );
}
