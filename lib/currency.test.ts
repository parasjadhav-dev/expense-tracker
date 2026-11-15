import { describe, expect, it } from "vitest";
import {
  CURRENCY_CODES,
  CURRENCY_INFO,
  DEFAULT_CURRENCY,
  currencySymbol,
  formatMinor,
  formatMinorCompact,
  isCurrencyCode,
  toCurrencyCode,
} from "@/lib/currency";
import { currencySchema } from "@/lib/validations/currency";

describe("the currency list", () => {
  it("defaults to rupees", () => {
    expect(DEFAULT_CURRENCY).toBe("INR");
    expect(CURRENCY_CODES).toContain("INR");
  });

  it("has details for every code and no duplicates", () => {
    expect(new Set(CURRENCY_CODES).size).toBe(CURRENCY_CODES.length);
    for (const code of CURRENCY_CODES) {
      expect(CURRENCY_INFO[code].name.length, code).toBeGreaterThan(2);
      expect(CURRENCY_INFO[code].locale, code).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
    }
  });

  it("only lists currencies with exactly 2 decimal places (money is stored in 1/100 units)", () => {
    for (const code of CURRENCY_CODES) {
      const digits = new Intl.NumberFormat(CURRENCY_INFO[code].locale, {
        style: "currency",
        currency: code,
      }).resolvedOptions();
      expect(digits.minimumFractionDigits, code).toBe(2);
      expect(digits.maximumFractionDigits, code).toBe(2);
    }
  });
});

describe("isCurrencyCode / toCurrencyCode", () => {
  it("accepts listed codes only, case-sensitively", () => {
    expect(isCurrencyCode("USD")).toBe(true);
    for (const bad of ["usd", "JPY", "", "USD ", null, undefined, 5, {}]) {
      expect(isCurrencyCode(bad), String(bad)).toBe(false);
    }
  });

  it("falls back to rupees for anything unknown", () => {
    expect(toCurrencyCode("EUR")).toBe("EUR");
    expect(toCurrencyCode("XXX")).toBe("INR");
    expect(toCurrencyCode(undefined)).toBe("INR");
  });
});

describe("formatMinor", () => {
  it("formats rupees with Indian grouping and other currencies with thousands commas", () => {
    expect(formatMinor(12345678, "INR")).toBe("₹1,23,456.78");
    expect(formatMinor(12345678, "USD")).toBe("$123,456.78");
    expect(formatMinor(12345678, "EUR")).toBe("€123,456.78");
    expect(formatMinor(12345678, "GBP")).toBe("£123,456.78");
  });

  it("shows Sri Lankan rupees as LKR, so they are never confused with Indian rupees", () => {
    // Intl puts a non-breaking space after a code, so the code and number never split across lines.
    const plain = (text: string) => text.replace(/ /g, " ");
    expect(plain(formatMinor(12345678, "LKR"))).toBe("LKR 123,456.78");
    expect(plain(formatMinor(0, "LKR"))).toBe("LKR 0.00");
    expect(currencySymbol("LKR")).toBe("LKR");
    expect(isCurrencyCode("LKR")).toBe(true);
  });

  it("always shows two decimals, for zero too", () => {
    for (const code of CURRENCY_CODES) {
      expect(formatMinor(0, code), code).toMatch(/0\.00$/);
      expect(formatMinor(5, code), code).toMatch(/0\.05$/);
    }
  });

  it("uses the code as the symbol where the locale has no short one", () => {
    expect(formatMinor(19950, "AED")).toContain("AED");
    expect(formatMinor(19950, "SAR")).toContain("SAR");
  });

  it("handles the largest stored amount without losing digits", () => {
    expect(formatMinor(2147483647, "USD")).toBe("$21,474,836.47");
    expect(formatMinor(2147483647, "INR")).toBe("₹2,14,74,836.47");
  });
});

describe("formatMinorCompact (chart axis labels)", () => {
  it("shortens big numbers", () => {
    expect(formatMinorCompact(1500000, "USD")).toBe("$15K");
    expect(formatMinorCompact(15000000, "INR")).toBe("₹1.5L");
  });
});

describe("currencySymbol", () => {
  it("returns the symbol alone", () => {
    expect(currencySymbol("INR")).toBe("₹");
    expect(currencySymbol("USD")).toBe("$");
    expect(currencySymbol("EUR")).toBe("€");
    expect(currencySymbol("GBP")).toBe("£");
    expect(currencySymbol("AED")).toBe("AED");
  });
});

describe("currencySchema", () => {
  it("accepts a listed currency", () => {
    expect(currencySchema.safeParse({ currency: "GBP" }).success).toBe(true);
  });

  it("rejects anything else", () => {
    for (const currency of ["gbp", "JPY", "", "USD;DROP", undefined, null, 5]) {
      expect(currencySchema.safeParse({ currency }).success, String(currency)).toBe(false);
    }
    expect(currencySchema.safeParse({}).success).toBe(false);
  });
});
