// The first thing a keyboard or screen-reader user reaches: a link that jumps past
// the navigation to the page's own content. Invisible until it has focus. Every
// page's <main> carries id="main-content" (and tabIndex -1, so it can take focus).
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-zinc-950 focus:shadow-lg focus:ring-2 focus:ring-[#0f766e] dark:focus:bg-zinc-900 dark:focus:text-zinc-50 dark:focus:ring-[#5eead4]"
    >
      Skip to main content
    </a>
  );
}
