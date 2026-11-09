import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  WARNING_THRESHOLD_PERCENT,
  budgetAlerts,
  budgetStatus,
  daysInMonth,
  daysLeftInMonth,
  isOverBudget,
  overBy,
  percentUsed,
  remaining,
  safeToSpend,
  spentByCategory,
  summarizeBudgets,
  totalSpent,
} from "@/lib/budget";

// Small deterministic random numbers, so the "random" tests give the same result
// on every run.
function lcg(seed: number) {
  let state = seed;
  return () => (state = (state * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
}

const NO_BUDGET = [null, undefined, 0, -5, Number.NaN, Number.POSITIVE_INFINITY];

describe("lib/budget.ts is pure", () => {
  // The helpers take the data and the date as arguments. If someone adds a
  // database call or a clock read, this fails and says so.
  const source = readFileSync(new URL("./budget.ts", import.meta.url), "utf8").replace(
    /\/\/.*$/gm,
    "",
  );

  it("has no imports", () => {
    expect(/^\s*import\s|\brequire\(/m.test(source)).toBe(false);
  });

  it("reads no database, clock, randomness, network or environment", () => {
    expect(/\b(db|prisma|Date|Math\.random|fetch|process|setTimeout|console)\b/.test(source)).toBe(false);
  });
});

describe("totalSpent and spentByCategory", () => {
  it("totals are 0 for no expenses", () => {
    expect(totalSpent([])).toBe(0);
    expect(spentByCategory([]).size).toBe(0);
  });

  it("adds integer paise exactly", () => {
    expect(
      totalSpent([
        { categoryId: "a", amount: 25000 },
        { categoryId: "b", amount: 7500 },
        { categoryId: "a", amount: 10050 },
      ]),
    ).toBe(42550);
  });

  it("groups by category and leaves out categories with no spending", () => {
    const totals = spentByCategory([
      { categoryId: "a", amount: 1 },
      { categoryId: "b", amount: 2 },
      { categoryId: "a", amount: 3 },
    ]);
    expect([...totals.entries()].sort()).toEqual([
      ["a", 4],
      ["b", 2],
    ]);
    expect(totals.get("missing") ?? 0).toBe(0);
  });

  it("is safe with ids such as __proto__ and constructor", () => {
    const totals = spentByCategory([
      { categoryId: "__proto__", amount: 5 },
      { categoryId: "constructor", amount: 7 },
    ]);
    expect(totals.get("__proto__")).toBe(5);
    expect(totals.get("constructor")).toBe(7);
  });
});

describe("remaining, overBy, percentUsed, isOverBudget", () => {
  it("remaining is budget minus spending, negative when overspent", () => {
    expect(remaining(25000, 100000)).toBe(75000);
    expect(remaining(100000, 100000)).toBe(0);
    expect(remaining(150000, 100000)).toBe(-50000);
  });

  it("overBy is how far past the budget, never negative", () => {
    expect(overBy(150, 100)).toBe(50);
    expect(overBy(100, 100)).toBe(0);
    expect(overBy(40, 100)).toBe(0);
  });

  it("percentUsed is unrounded and can pass 100", () => {
    expect(percentUsed(250, 1000)).toBe(25);
    expect(percentUsed(0, 1000)).toBe(0);
    expect(percentUsed(1500, 1000)).toBe(150);
    expect(percentUsed(1, 3)).toBeCloseTo(33.3333333, 6);
  });

  it("isOverBudget is true only strictly above the budget", () => {
    expect(isOverBudget(99, 100)).toBe(false);
    expect(isOverBudget(100, 100)).toBe(false); // spending exactly the budget is not "over"
    expect(isOverBudget(101, 100)).toBe(true);
    expect(isOverBudget(0, 100)).toBe(false);
  });

  it.each(NO_BUDGET)("treats %s as no budget", (none) => {
    expect(remaining(500, none)).toBeNull();
    expect(percentUsed(500, none)).toBeNull();
    expect(overBy(500, none)).toBe(0);
    expect(isOverBudget(500, none)).toBe(false);
    expect(budgetStatus(500, none)).toBe("none");
  });
});

describe("budgetStatus: the 80% and 100% thresholds are exact", () => {
  const statuses = (budget: number, spends: number[]) =>
    spends.map((spent) => budgetStatus(spent, budget));

  it("uses an 80% warning threshold", () => {
    expect(WARNING_THRESHOLD_PERCENT).toBe(80);
  });

  it("budget 1000: ok below 800, warning from 800, limit from 1000", () => {
    expect(statuses(1000, [0, 799, 800, 999, 1000, 1001])).toEqual([
      "ok",
      "ok",
      "warning",
      "warning",
      "limit",
      "limit",
    ]);
  });

  it("small budgets where 80% is a whole number (10 and 5)", () => {
    expect(statuses(10, [7, 8, 9, 10])).toEqual(["ok", "warning", "warning", "limit"]);
    expect(statuses(5, [3, 4, 5])).toEqual(["ok", "warning", "limit"]);
  });

  it("a budget where 80% is a fraction (7 -> 5.6)", () => {
    expect(statuses(7, [5, 6, 7])).toEqual(["ok", "warning", "limit"]);
  });

  it("a budget of 1 paisa", () => {
    expect(statuses(1, [0, 1])).toEqual(["ok", "limit"]);
  });

  it("the largest possible budget is still exact (no float rounding)", () => {
    const max = 2147483647; // 80% is 1717986917.6
    expect(budgetStatus(1717986917, max)).toBe("ok");
    expect(budgetStatus(1717986918, max)).toBe("warning");
    expect(budgetStatus(max - 1, max)).toBe("warning");
    expect(budgetStatus(max, max)).toBe("limit");
  });

  it("nothing spent is ok, and spending with no budget stays 'none'", () => {
    expect(budgetStatus(0, 50000)).toBe("ok");
    expect(budgetStatus(10 ** 9, undefined)).toBe("none");
  });

  it("matches exact BigInt arithmetic across 50,000 random cases", () => {
    const random = lcg(123456789);
    const int = (max: number) => Math.floor(random() * max);
    for (let i = 0; i < 50000; i++) {
      const budget = 1 + int(i % 3 === 0 ? 2147483646 : i % 3 === 1 ? 1000 : 50);
      const spent = int(i % 2 ? budget * 2 : budget + 1);
      const s = BigInt(spent);
      const b = BigInt(budget);
      const expected = s >= b ? "limit" : s * BigInt(100) >= b * BigInt(80) ? "warning" : "ok";
      expect(budgetStatus(spent, budget), `spent=${spent} budget=${budget}`).toBe(expected);
    }
  });

  it("never improves as spending grows", () => {
    const rank: Record<string, number> = { ok: 0, warning: 1, limit: 2 };
    for (const budget of [1, 2, 3, 7, 10, 99, 1000, 123457]) {
      let lastRank = 0;
      let lastPercent = -1;
      for (let spent = 0; spent <= budget * 2; spent += Math.max(1, Math.floor(budget / 50))) {
        const r = rank[budgetStatus(spent, budget)];
        const p = percentUsed(spent, budget)!;
        expect(r >= lastRank && p >= lastPercent, `budget=${budget} spent=${spent}`).toBe(true);
        lastRank = r;
        lastPercent = p;
      }
    }
  });
});

describe("summarizeBudgets", () => {
  const categories = [
    { id: "food", name: "Food" },
    { id: "travel", name: "Travel" },
    { id: "rent", name: "Rent" },
    { id: "constructor", name: "Odd" },
  ];
  const expenses = [
    { categoryId: "food", amount: 25000 },
    { categoryId: "food", amount: 10050 },
    { categoryId: "travel", amount: 7500 },
    { categoryId: "gone", amount: 1000 }, // not in the category list, still in the overall total
  ];
  const summary = summarizeBudgets({
    overallBudget: 100000,
    categoryBudgets: { food: 40000, travel: 5000 },
    categories,
    expenses,
  });

  it("the overall line counts every expense passed in", () => {
    expect(summary.overall).toEqual({
      budget: 100000,
      spent: 43550,
      remaining: 56450,
      percentUsed: 43.55,
      status: "ok",
    });
  });

  it("category lines keep the order they were given", () => {
    expect(summary.categories.map((c) => c.name)).toEqual(["Food", "Travel", "Rent", "Odd"]);
  });

  it("Food: 35,050 of 40,000 is a warning", () => {
    expect(summary.categories[0]).toEqual({
      categoryId: "food",
      name: "Food",
      budget: 40000,
      spent: 35050,
      remaining: 4950,
      percentUsed: 87.625,
      status: "warning",
    });
  });

  it("Travel: 7,500 of 5,000 is over the limit, with negative remaining", () => {
    const travel = summary.categories[1];
    expect(travel.status).toBe("limit");
    expect(travel.remaining).toBe(-2500);
    expect(travel.percentUsed).toBe(150);
  });

  it("a category with no budget and no spending", () => {
    expect(summary.categories[2]).toEqual({
      categoryId: "rent",
      name: "Rent",
      budget: null,
      spent: 0,
      remaining: null,
      percentUsed: null,
      status: "none",
    });
  });

  it("does not pick up Object.prototype members for odd ids", () => {
    expect(summary.categories[3].budget).toBeNull();
  });

  it("ignores budgets inherited from a prototype: only own keys count", () => {
    const inherited: Record<string, number> = Object.create({ rent: 12345 });
    inherited.food = 40000;
    const s = summarizeBudgets({ overallBudget: null, categoryBudgets: inherited, categories, expenses });
    expect(s.categories[0].budget).toBe(40000);
    expect(s.categories[2].budget).toBeNull();
  });

  it("works with no overall budget", () => {
    const s = summarizeBudgets({ overallBudget: null, categoryBudgets: {}, categories, expenses });
    expect(s.overall).toEqual({
      budget: null,
      spent: 43550,
      remaining: null,
      percentUsed: null,
      status: "none",
    });
  });

  it("works with nothing at all", () => {
    expect(
      summarizeBudgets({ overallBudget: undefined, categoryBudgets: {}, categories: [], expenses: [] }),
    ).toEqual({
      overall: { budget: null, spent: 0, remaining: null, percentUsed: null, status: "none" },
      categories: [],
    });
  });

  it("does not change its inputs", () => {
    const freeze = <T extends object>(value: T): T => {
      for (const inner of Object.values(value)) {
        if (typeof inner === "object" && inner !== null) freeze(inner);
      }
      return Object.freeze(value);
    };
    expect(() =>
      summarizeBudgets({
        overallBudget: 100000,
        categoryBudgets: freeze({ food: 40000 }),
        categories: freeze(categories.map((c) => ({ ...c }))),
        expenses: freeze(expenses.map((e) => ({ ...e }))),
      }),
    ).not.toThrow();
  });

  it("category spending adds up to the total when every category is listed (2,000 random months)", () => {
    const random = lcg(42);
    for (let i = 0; i < 2000; i++) {
      const n = 1 + Math.floor(random() * 8);
      const cats = Array.from({ length: n }, (_, k) => ({ id: `c${k}`, name: `C${k}` }));
      const spend = Array.from({ length: Math.floor(random() * 40) }, () => ({
        categoryId: `c${Math.floor(random() * n)}`,
        amount: 1 + Math.floor(random() * 500000),
      }));
      const s = summarizeBudgets({ overallBudget: null, categoryBudgets: {}, categories: cats, expenses: spend });
      expect(s.categories.reduce((sum, c) => sum + c.spent, 0)).toBe(s.overall.spent);
    }
  });
});

describe("budgetAlerts", () => {
  const cats = [
    { id: "food", name: "Food" },
    { id: "travel", name: "Travel" },
    { id: "rent", name: "Rent" },
    { id: "health", name: "Health" },
    { id: "bills", name: "Bills" },
    { id: "other", name: "Other" },
  ];
  const summarize = (
    overall: number | null,
    budgets: Record<string, number>,
    spent: Record<string, number>,
  ) =>
    summarizeBudgets({
      overallBudget: overall,
      categoryBudgets: budgets,
      categories: cats,
      expenses: Object.entries(spent).map(([categoryId, amount]) => ({ categoryId, amount })),
    });
  const kinds = (s: ReturnType<typeof summarize>) =>
    budgetAlerts(s).map((a) => `${a.name}:${a.kind}`);

  it("no alerts when there is nothing to warn about", () => {
    expect(budgetAlerts(summarize(null, {}, {}))).toEqual([]);
    expect(budgetAlerts(summarize(null, {}, { food: 10 ** 7 }))).toEqual([]); // spending, no budget
    expect(kinds(summarize(100000, { food: 100000 }, { food: 10000 }))).toEqual([]);
  });

  describe("category thresholds on a 100,000 budget", () => {
    const food = (spent: number) => kinds(summarize(null, { food: 100000 }, { food: spent }));

    it.each([
      [0, []],
      [79999, []],
      [80000, ["Food:warning"]], // exactly 80%
      [99999, ["Food:warning"]],
      [100000, ["Food:reached"]], // exactly the budget
      [100001, ["Food:over"]], // one paisa over
    ])("%i spent -> %j", (spent, expected) => {
      expect(food(spent)).toEqual(expected);
    });
  });

  it("carries the numbers a banner needs", () => {
    const [over] = budgetAlerts(summarize(null, { food: 100000 }, { food: 125050 }));
    expect(over).toEqual({
      kind: "over",
      scope: "category",
      categoryId: "food",
      name: "Food",
      budget: 100000,
      spent: 125050,
      overBy: 25050,
      percentUsed: 125.05,
    });
    const [warning] = budgetAlerts(summarize(null, { food: 100000 }, { food: 80000 }));
    expect(warning.overBy).toBe(0);
    expect(warning.percentUsed).toBe(80);
  });

  it("the overall alert has scope 'overall' and counts all spending", () => {
    const [alert] = budgetAlerts(summarize(100000, {}, { food: 90000 }));
    expect(alert).toMatchObject({ scope: "overall", categoryId: null, name: "Overall", kind: "warning" });
    expect(kinds(summarize(100000, {}, { food: 50000, rent: 50000 }))).toEqual(["Overall:reached"]);
    expect(kinds(summarize(100000, {}, { food: 50000, rent: 50001 }))).toEqual(["Overall:over"]);
  });

  it("orders by seriousness, then overall before categories, then the given order", () => {
    const s = summarize(
      100000,
      { food: 100000, travel: 100000, rent: 100000, health: 100000, bills: 100000, other: 100000 },
      { food: 85000, travel: 150000, rent: 100000, health: 90000, bills: 200000, other: 1000 },
    );
    expect(kinds(s)).toEqual([
      "Overall:over",
      "Travel:over",
      "Bills:over",
      "Rent:reached",
      "Food:warning",
      "Health:warning",
    ]);
  });

  it("a warning never sorts ahead of an over", () => {
    expect(kinds(summarize(null, { food: 100, travel: 100 }, { food: 85, travel: 150 }))).toEqual([
      "Travel:over",
      "Food:warning",
    ]);
  });

  it("matches exact BigInt arithmetic across 20,000 random budgets", () => {
    const random = lcg(7);
    for (let i = 0; i < 20000; i++) {
      const budget = 1 + Math.floor(random() * (i % 2 ? 1000 : 2147483000));
      const spent = Math.floor(random() * budget * 1.5);
      const alerts = budgetAlerts(summarize(null, { food: budget }, { food: spent }));
      const s = BigInt(spent);
      const b = BigInt(budget);
      const expected = s > b ? "over" : s === b ? "reached" : s * BigInt(100) >= b * BigInt(80) ? "warning" : null;
      expect(alerts.length, `spent=${spent} budget=${budget}`).toBe(expected ? 1 : 0);
      if (expected) expect(alerts[0].kind, `spent=${spent} budget=${budget}`).toBe(expected);
    }
  });
});

describe("daysInMonth", () => {
  it("matches the calendar for every month from 1900 to 2400", () => {
    for (let year = 1900; year <= 2400; year++) {
      for (let month = 1; month <= 12; month++) {
        const expected = new Date(Date.UTC(year, month, 0)).getUTCDate();
        expect(daysInMonth(`${year}-${String(month).padStart(2, "0")}`)).toBe(expected);
      }
    }
  });

  it("knows the leap-year rules (2000 and 2024 leap; 1900 and 2100 not)", () => {
    expect(daysInMonth("2000-02")).toBe(29);
    expect(daysInMonth("2024-02")).toBe(29);
    expect(daysInMonth("1900-02")).toBe(28);
    expect(daysInMonth("2100-02")).toBe(28);
    expect(daysInMonth("2026-02")).toBe(28);
  });

  it.each(["2026-13", "2026-00", "26-11", "", "2026-11-01", " 2026-11", "2026-1", "abc"])(
    "rejects %j instead of returning NaN",
    (bad) => {
      expect(() => daysInMonth(bad)).toThrow(RangeError);
    },
  );
});

describe("daysLeftInMonth", () => {
  it("November 2026 (30 days): first day, mid month, last day", () => {
    expect(daysLeftInMonth("2026-11", "2026-11-01")).toBe(30);
    expect(daysLeftInMonth("2026-11", "2026-11-09")).toBe(22);
    expect(daysLeftInMonth("2026-11", "2026-11-30")).toBe(1);
  });

  it("a month that has not started has every day left", () => {
    expect(daysLeftInMonth("2026-11", "2026-10-31")).toBe(30);
    expect(daysLeftInMonth("2027-01", "2026-12-31")).toBe(31);
    expect(daysLeftInMonth("2026-12", "2020-01-01")).toBe(31);
  });

  it("a month that has ended has none left", () => {
    expect(daysLeftInMonth("2026-11", "2026-12-01")).toBe(0);
    expect(daysLeftInMonth("2026-12", "2027-01-01")).toBe(0);
    expect(daysLeftInMonth("2026-11", "2030-06-15")).toBe(0);
  });

  it("counts down 29..1 through February 2028 (a leap year)", () => {
    const seen = Array.from({ length: 29 }, (_, i) =>
      daysLeftInMonth("2028-02", `2028-02-${String(i + 1).padStart(2, "0")}`),
    );
    expect(seen).toEqual(Array.from({ length: 29 }, (_, i) => 29 - i));
  });

  it("the last day of every month from 2024 to 2027 has exactly 1 day left", () => {
    for (let year = 2024; year <= 2027; year++) {
      for (let month = 1; month <= 12; month++) {
        const mm = String(month).padStart(2, "0");
        const last = String(daysInMonth(`${year}-${mm}`)).padStart(2, "0");
        expect(daysLeftInMonth(`${year}-${mm}`, `${year}-${mm}-${last}`)).toBe(1);
      }
    }
  });

  it.each(["2026-11", "2026-11-32", "2026-11-00", "11/09/2026", "", "2026-13-01"])(
    "rejects the date %j",
    (bad) => {
      expect(() => daysLeftInMonth("2026-11", bad)).toThrow(RangeError);
    },
  );
});

describe("safeToSpend", () => {
  const safe = (budget: number | null | undefined, spent: number, daysLeft: number) =>
    safeToSpend({ budget, spent, daysLeft });

  it("₹30,000 budget, ₹8,000 spent, 22 days left is ₹1,000 a day", () => {
    expect(safe(3000000, 800000, 22)).toEqual({
      kind: "ok",
      perDay: 100000,
      remaining: 2200000,
      daysLeft: 22,
      lastDay: false,
    });
  });

  it("rounds down to the paisa so it never promises too much (1000 over 3 days is 333)", () => {
    expect(safe(1000, 0, 3)).toMatchObject({ kind: "ok", perDay: 333 });
  });

  it("fewer paise than days left means 0 a day, but still 'ok'", () => {
    expect(safe(1000, 995, 10)).toMatchObject({ kind: "ok", perDay: 0, remaining: 5 });
  });

  it("on the last day the whole remainder is available, and it says so", () => {
    expect(safe(1000, 400, 1)).toEqual({
      kind: "ok",
      perDay: 600,
      remaining: 600,
      daysLeft: 1,
      lastDay: true,
    });
  });

  it("over budget: nothing is safe, and it reports by how much", () => {
    expect(safe(1000, 1001, 10)).toEqual({ kind: "over", overBy: 1 });
  });

  it("over budget wins on the last day and after the month has ended", () => {
    expect(safe(1000, 1500, 1)).toEqual({ kind: "over", overBy: 500 });
    expect(safe(1000, 1500, 0)).toEqual({ kind: "over", overBy: 500 });
  });

  it("spending exactly the budget is 'budget-used', whatever the day count", () => {
    for (const days of [30, 1, 0, -1, Number.NaN]) {
      expect(safe(1000, 1000, days)).toEqual({ kind: "budget-used" });
    }
  });

  it.each(NO_BUDGET)("budget %s means 'no-budget'", (none) => {
    expect(safe(none, 500, 10)).toEqual({ kind: "no-budget" });
  });

  it.each([0, -1, -30, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 0.5, 0.999])(
    "daysLeft %s with money left is 'month-ended' (no division at all)",
    (days) => {
      expect(safe(1000, 400, days)).toEqual({ kind: "month-ended", remaining: 600 });
    },
  );

  it("floors a fractional day count (2.9 becomes 2)", () => {
    expect(safe(1000, 0, 2.9)).toEqual({
      kind: "ok",
      perDay: 500,
      remaining: 1000,
      daysLeft: 2,
      lastDay: false,
    });
  });

  it("nothing spent: the whole budget spread over the month", () => {
    expect(safe(3100000, 0, 31)).toMatchObject({ perDay: 100000 });
  });

  it("a huge day count stays finite", () => {
    const result = safe(1000, 0, 1e9);
    expect(result).toMatchObject({ kind: "ok", perDay: 0 });
  });

  it("perDay is exactly floor(remaining / days) and never NaN or Infinity (50,000 random cases)", () => {
    const random = lcg(99);
    for (let i = 0; i < 50000; i++) {
      const budget = 1 + Math.floor(random() * (i % 2 ? 2147483646 : 5000));
      const spent = Math.floor(random() * budget * 1.2);
      const days = Math.floor(random() * 33) - 1; // -1..31, includes 0
      const result = safe(budget, spent, days);
      for (const value of Object.values(result)) {
        if (typeof value === "number") expect(Number.isFinite(value)).toBe(true);
      }
      if (result.kind === "ok") {
        const left = BigInt(budget - spent);
        const d = BigInt(days);
        expect(days >= 1 && spent < budget).toBe(true);
        expect(BigInt(result.perDay) * d <= left && left < (BigInt(result.perDay) + BigInt(1)) * d).toBe(true);
        expect(result.perDay).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("following the advice every day never breaks the budget (3,000 simulated months)", () => {
    const random = lcg(5);
    for (let i = 0; i < 3000; i++) {
      const month = `${2024 + Math.floor(random() * 4)}-${String(1 + Math.floor(random() * 12)).padStart(2, "0")}`;
      const budget = 1 + Math.floor(random() * 5_000_000);
      let spent = Math.floor(random() * budget * 0.5);
      for (let day = 1; day <= daysInMonth(month); day++) {
        const left = daysLeftInMonth(month, `${month}-${String(day).padStart(2, "0")}`);
        const result = safe(budget, spent, left);
        if (result.kind === "ok") spent += result.perDay;
        expect(spent, `${month} day ${day}`).toBeLessThanOrEqual(budget);
      }
    }
  });
});
