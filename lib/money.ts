// Amounts are stored as integer paise (₹199.50 -> 19950). Parsing uses string
// math, never floating point, so values like 0.1 + 0.2 cannot drift.

// Largest value the Int column holds (PostgreSQL INTEGER).
export const MAX_PAISE = 2_147_483_647;

export type ParsedAmount =
  | { ok: true; paise: number }
  | { ok: false; reason: "invalid" | "zero" | "too_large" };

export function parseRupeesToPaise(input: string): ParsedAmount {
  const cleaned = input.trim().replace(/,/g, "");
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(cleaned)) {
    return { ok: false, reason: "invalid" };
  }

  const [whole, fraction = ""] = cleaned.split(".");
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));

  if (paise === 0) return { ok: false, reason: "zero" };
  if (paise > MAX_PAISE) return { ok: false, reason: "too_large" };
  return { ok: true, paise };
}

// 129950 -> "1299.50". For prefilling form inputs, so no currency symbol or
// grouping commas.
export function paiseToRupeesInput(paise: number): string {
  const whole = Math.floor(paise / 100);
  const fraction = String(paise % 100).padStart(2, "0");
  return `${whole}.${fraction}`;
}

export function formatPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(paise / 100);
}
