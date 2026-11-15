import { describe, expect, it } from "vitest";
import { parseMoney, parseStatement } from "@/lib/csv-import";

const ok = (paise: number, extra: Record<string, unknown> = {}) =>
  expect.objectContaining({ kind: "ok", paise, ...extra });

describe("parseMoney: currency markers", () => {
  it.each([
    ["₹1,234.50", 123450],
    ["$99", 9900],
    ["$ 99.00", 9900],
    ["€12.30", 1230],
    ["£0.99", 99],
    ["₱250", 25000],
    ["₦1,000", 100000],
    ["Rs. 99.00", 9900],
    ["Rs 99", 9900],
    ["INR 500", 50000],
    ["USD 20.5", 2050],
    ["US$20", 2000],
    ["A$15.75", 1575],
    ["NZ$3", 300],
    ["RM 12.40", 1240],
    ["AED 100", 10000],
    ["99 USD", 9900],
    ["1,234.50 EUR", 123450],
    ["500", 50000],
  ])("reads %s", (raw, paise) => {
    expect(parseMoney(raw)).toEqual(ok(paise));
  });

  it("keeps the sign and Dr/Cr rules with a symbol", () => {
    expect(parseMoney("-$5.00")).toEqual(ok(500, { negative: true }));
    expect(parseMoney("($250.00)")).toEqual(ok(25000, { negative: true }));
    expect(parseMoney("$250.00 Dr")).toEqual(ok(25000, { side: "dr" }));
    expect(parseMoney("Cr €100")).toEqual(ok(10000, { side: "cr" }));
  });

  it("rejects a marker with no number, and unknown letters", () => {
    expect(parseMoney("$")).toEqual({ kind: "empty" });
    expect(parseMoney("USD")).toEqual({ kind: "empty" });
    expect(parseMoney("12abc")).toEqual({ kind: "invalid" });
    expect(parseMoney("JPY 100")).toEqual({ kind: "invalid" });
  });
});

describe("parseStatement: dollar statements", () => {
  const csv = [
    "Date,Description,Amount",
    "2026-11-02,Starbucks Coffee,-$4.75",
    "2026-11-03,Uber ride,-$12.30",
    "2026-11-04,Salary,$2500.00",
  ].join("\n");

  it("imports amounts that carry a dollar sign (minus = money out, plus = money in)", () => {
    const result = parseStatement(csv, "2026-11-10");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.rows.map((row) => row.amount)).toEqual([475, 1230]);
  });
});
