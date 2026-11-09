// Accepts only same-site relative paths, so a login link cannot send users to
// another site. Anything else falls back to the home page.
export function safeCallbackUrl(value: unknown): string {
  if (typeof value !== "string") return "/";
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  return value;
}
