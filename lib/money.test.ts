import { describe, expect, it } from "vitest";
import {
  MAX_PAISE,
  formatPaise,
  paiseToRupeesInput,
  parseRupeesToPaise,
} from "@/lib/money";

describe("parseRupeesToPaise", () => {
  it("turns rupees into integer paise", () => {
    expect(parseRupeesToPaise("199")).toEqual({ ok: true, paise: 19900 });
    expect(parseRupeesToPaise("199.5")).toEqual({ ok: true, paise: 19950 });
    expect(parseRupeesToPaise("199.50")).toEqual({ ok: true, paise: 19950 });
    expect(parseRupeesToPaise("0.05")).toEqual({ ok: true, paise: 5 });
  });

  it("accepts thousands separators and surrounding spaces", () => {
    expect(parseRupeesToPaise(" 1,23,456.78 ")).toEqual({ ok: true, paise: 12345678 });
  });

  it("does not drift like floating point (0.1 + 0.2 style amounts)", () => {
    expect(parseRupeesToPaise("0.30")).toEqual({ ok: true, paise: 30 });
    expect(parseRupeesToPaise("1.15")).toEqual({ ok: true, paise: 115 });
    expect(parseRupeesToPaise("4.35")).toEqual({ ok: true, paise: 435 });
  });

  it("rejects zero", () => {
    expect(parseRupeesToPaise("0")).toEqual({ ok: false, reason: "zero" });
    expect(parseRupeesToPaise("0.00")).toEqual({ ok: false, reason: "zero" });
  });

  it.each(["", "abc", "-5", "1.234", "1..2", "₹5", "5 0", "1e3"])(
    "rejects %j as invalid",
    (input) => {
      expect(parseRupeesToPaise(input)).toEqual({ ok: false, reason: "invalid" });
    },
  );

  it("rejects amounts the database column cannot hold", () => {
    expect(parseRupeesToPaise("99999999999")).toEqual({ ok: false, reason: "too_large" });
    const biggest = parseRupeesToPaise(`${Math.floor(MAX_PAISE / 100)}.${MAX_PAISE % 100}`);
    expect(biggest).toEqual({ ok: true, paise: MAX_PAISE });
  });
});

describe("paiseToRupeesInput", () => {
  it("formats for a form field: no symbol, no grouping", () => {
    expect(paiseToRupeesInput(129950)).toBe("1299.50");
    expect(paiseToRupeesInput(5)).toBe("0.05");
    expect(paiseToRupeesInput(100)).toBe("1.00");
  });

  it("round-trips with parseRupeesToPaise", () => {
    for (const paise of [1, 99, 100, 12345, 1999999]) {
      expect(parseRupeesToPaise(paiseToRupeesInput(paise))).toEqual({ ok: true, paise });
    }
  });
});

describe("formatPaise", () => {
  it("shows rupees with Indian digit grouping", () => {
    expect(formatPaise(0)).toBe("₹0.00");
    expect(formatPaise(19950)).toBe("₹199.50");
    expect(formatPaise(12345678)).toBe("₹1,23,456.78");
  });
});
