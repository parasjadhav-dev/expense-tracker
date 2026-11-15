// The currencies a user can pick. Money is always stored as whole minor units
// (paise, cents, pence...), so every currency here must have exactly 2 decimal
// places. Currencies with 0 or 3 (yen, dinar) are left out on purpose: the money
// code assumes 100 minor units per major unit.
//
// Switching currency changes how amounts are shown. It does not convert them.

export const CURRENCY_CODES = [
  "INR",
  "LKR",
  "USD",
  "EUR",
  "GBP",
  "AUD",
  "CAD",
  "NZD",
  "SGD",
  "AED",
  "SAR",
  "MYR",
  "PHP",
  "NGN",
] as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

// `locale` decides digit grouping and where the symbol goes (en-IN groups as
// 12,34,567.50; the others as 1,234,567.50).
export const CURRENCY_INFO: Record<CurrencyCode, { name: string; locale: string }> = {
  INR: { name: "Indian rupee", locale: "en-IN" },
  LKR: { name: "Sri Lankan rupee", locale: "en-LK" },
  USD: { name: "US dollar", locale: "en-US" },
  EUR: { name: "Euro", locale: "en-IE" },
  GBP: { name: "British pound", locale: "en-GB" },
  AUD: { name: "Australian dollar", locale: "en-AU" },
  CAD: { name: "Canadian dollar", locale: "en-CA" },
  NZD: { name: "New Zealand dollar", locale: "en-NZ" },
  SGD: { name: "Singapore dollar", locale: "en-SG" },
  AED: { name: "UAE dirham", locale: "en-AE" },
  SAR: { name: "Saudi riyal", locale: "en-SA" },
  MYR: { name: "Malaysian ringgit", locale: "en-MY" },
  PHP: { name: "Philippine peso", locale: "en-PH" },
  NGN: { name: "Nigerian naira", locale: "en-NG" },
};

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return typeof value === "string" && (CURRENCY_CODES as readonly string[]).includes(value);
}

// Anything unknown (a bad database value, an old session) falls back to rupees.
export function toCurrencyCode(value: unknown): CurrencyCode {
  return isCurrencyCode(value) ? value : DEFAULT_CURRENCY;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatter(code: CurrencyCode, compact: boolean): Intl.NumberFormat {
  const key = `${code}:${compact ? "c" : "f"}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(
      CURRENCY_INFO[code].locale,
      compact
        ? { style: "currency", currency: code, notation: "compact", maximumFractionDigits: 1 }
        : { style: "currency", currency: code },
    );
    formatters.set(key, f);
  }
  return f;
}

// 19950 -> "₹199.50" (INR) or "$199.50" (USD).
export function formatMinor(minor: number, code: CurrencyCode): string {
  return formatter(code, false).format(minor / 100);
}

// Axis ticks only: "₹10K", "₹1.5L" (INR), "$15K" (USD).
export function formatMinorCompact(minor: number, code: CurrencyCode): string {
  return formatter(code, true).format(minor / 100);
}

// The symbol alone, for form labels: "₹", "$", "€", "AED".
export function currencySymbol(code: CurrencyCode): string {
  const part = formatter(code, false)
    .formatToParts(0)
    .find((p) => p.type === "currency");
  return part?.value ?? code;
}
