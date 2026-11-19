import { describe, expect, it } from "vitest";
import {
  buildInsights,
  budgetRunOutDay,
  percentChange,
  previousMonthOf,
  projectMonthTotal,
  spentThroughDay,
  type InsightInput,
} from "./insights";

// Amounts are paise: 100_00 is 100.00.
const base: InsightInput = {
  month: "2026-11",
  isCurrentMonth: true,
  daysElapsed: 10,
  spent: 10_000_00,
  previousSpent: 8_000_00,
  budget: 45_000_00,
  categories: [],
  currency: "INR",
  budgetsHref: "/budgets?month=2026-11",
};

// Only the comparison and the mover: no budget, and too early to forecast.
const early: InsightInput = { ...base, budget: null, daysElapsed: 1 };

describe("previousMonthOf", () => {
  it("steps back one month, across a year", () => {
    expect(previousMonthOf("2026-11")).toBe("2026-10");
    expect(previousMonthOf("2026-01")).toBe("2025-12");
  });
  it("rejects a bad month", () => {
    expect(() => previousMonthOf("2026-13")).toThrow(RangeError);
  });
});

describe("spentThroughDay", () => {
  const days = [
    { date: "2026-10-02", amount: 100 },
    { date: "2026-10-10", amount: 200 },
    { date: "2026-10-11", amount: 400 },
    { date: "2026-11-03", amount: 800 },
  ];
  it("adds the days up to and including the given day, for that month only", () => {
    expect(spentThroughDay(days, "2026-10", 10)).toBe(300);
    expect(spentThroughDay(days, "2026-10", 31)).toBe(700);
    expect(spentThroughDay(days, "2026-10", 1)).toBe(0);
  });
});

describe("percentChange", () => {
  it("rounds to a whole percent", () => {
    expect(percentChange(112, 100)).toBe(12);
    expect(percentChange(50, 100)).toBe(-50);
  });
  it("is null when there is nothing to compare with", () => {
    expect(percentChange(10, 0)).toBeNull();
  });
});

describe("projectMonthTotal", () => {
  it("carries the daily average to the end of the month", () => {
    expect(projectMonthTotal({ spent: 10_000, daysElapsed: 10, daysInMonth: 30 })).toBe(30_000);
  });
  it("does not guess from the first days, an empty month or a finished month", () => {
    expect(projectMonthTotal({ spent: 5_000, daysElapsed: 2, daysInMonth: 30 })).toBeNull();
    expect(projectMonthTotal({ spent: 0, daysElapsed: 10, daysInMonth: 30 })).toBeNull();
    expect(projectMonthTotal({ spent: 5_000, daysElapsed: 30, daysInMonth: 30 })).toBeNull();
  });
});

describe("budgetRunOutDay", () => {
  it("finds the day the budget is used up at the current pace", () => {
    // 1,000 a day against a 20,000 budget: day 20.
    expect(budgetRunOutDay({ spent: 10_000, daysElapsed: 10, daysInMonth: 30, budget: 20_000 })).toBe(20);
  });
  it("is null when the budget lasts the month, or is already used", () => {
    expect(budgetRunOutDay({ spent: 10_000, daysElapsed: 10, daysInMonth: 30, budget: 40_000 })).toBeNull();
    expect(budgetRunOutDay({ spent: 10_000, daysElapsed: 10, daysInMonth: 30, budget: 10_000 })).toBeNull();
  });
});

describe("buildInsights: pace", () => {
  it("says how much more was spent than at the same point last month", () => {
    const [pace] = buildInsights({ ...early, previousSpent: 8_928_57 });
    expect(pace.kind).toBe("pace");
    expect(pace.title).toBe("12% more than the same point in October");
    expect(pace.tone).toBe("warn");
  });

  it("flags a large jump as bad, and a drop as good", () => {
    expect(buildInsights({ ...early, previousSpent: 5_000_00 })[0].tone).toBe("bad");
    const less = buildInsights({ ...early, previousSpent: 20_000_00 })[0];
    expect(less.title).toBe("50% less than the same point in October");
    expect(less.tone).toBe("good");
  });

  it("calls a tiny change about the same", () => {
    const [pace] = buildInsights({ ...early, previousSpent: 10_050_00 });
    expect(pace.title).toBe("About the same as the same point in October");
    expect(pace.tone).toBe("neutral");
  });

  it("compares a finished month with the whole of the month before", () => {
    const [pace] = buildInsights({ ...base, isCurrentMonth: false, daysElapsed: 30 });
    expect(pace.title).toBe("25% more than October");
  });

  it("says nothing without last month's spending, or without any this month", () => {
    expect(buildInsights({ ...early, previousSpent: 0 })).toEqual([]);
    expect(buildInsights({ ...early, spent: 0 })).toEqual([]);
  });
});

describe("buildInsights: projection", () => {
  it("warns when the pace will overshoot, with the day the budget runs out", () => {
    // 10,000 in 10 days = 1,000 a day; 30 days = 30,000 against a 20,000 budget.
    const projection = buildInsights({ ...base, budget: 20_000_00, previousSpent: 0 }).find(
      (insight) => insight.kind === "projection",
    );
    expect(projection?.tone).toBe("bad");
    expect(projection?.title).toBe("On pace to overshoot by about ₹10,000.00");
    expect(projection?.detail).toContain("runs out around 20 Nov");
  });

  it("reassures when the pace fits the budget", () => {
    const projection = buildInsights({ ...base, budget: 45_000_00, previousSpent: 0 })[0];
    expect(projection.tone).toBe("good");
    expect(projection.title).toBe("On track to finish about ₹15,000.00 under budget");
  });

  it("offers to set a budget when there is none", () => {
    const projection = buildInsights({ ...base, budget: null, previousSpent: 0 })[0];
    expect(projection.tone).toBe("neutral");
    expect(projection.href).toBe("/budgets?month=2026-11");
  });

  it("does not forecast an overspent month, a past month or the first days", () => {
    const kinds = (input: InsightInput) => buildInsights(input).map((insight) => insight.kind);
    expect(kinds({ ...base, budget: 5_000_00, previousSpent: 0 })).not.toContain("projection");
    expect(kinds({ ...base, isCurrentMonth: false, previousSpent: 0 })).not.toContain("projection");
    expect(kinds({ ...base, daysElapsed: 2, previousSpent: 0 })).not.toContain("projection");
  });
});

describe("buildInsights: biggest mover", () => {
  const food = { name: "Food", current: 6_000_00, previous: 4_000_00 };
  const travel = { name: "Travel", current: 1_000_00, previous: 3_000_00 };
  const bills = { name: "Bills", current: 2_000_00, previous: 2_100_00 };
  const mover = (categories: InsightInput["categories"]) =>
    buildInsights({ ...early, previousSpent: 0, categories }).find((i) => i.kind === "mover");

  it("picks the category that changed most, in either direction", () => {
    expect(mover([food, bills])?.title).toBe("Food is up ₹2,000.00 (+50%)");
    const down = mover([travel, bills]);
    expect(down?.tone).toBe("good");
    expect(down?.title).toBe("Travel is down ₹2,000.00 (-67%)");
  });

  it("ignores wobbles under 5% of last month's total", () => {
    const quiet = [
      { name: "Food", current: 4_050_00, previous: 4_000_00 },
      { name: "Bills", current: 2_000_00, previous: 2_000_00 },
    ];
    expect(mover(quiet)).toBeUndefined();
  });

  it("handles a category with nothing last month", () => {
    const found = mover([
      { name: "Gifts", current: 2_000_00, previous: 0 },
      { name: "Food", current: 4_000_00, previous: 4_000_00 },
    ]);
    expect(found?.title).toBe("Gifts is up ₹2,000.00");
    expect(found?.detail).toBe("Nothing in Gifts at this point last month.");
  });
});

describe("buildInsights: order", () => {
  it("puts the forecast first, then the comparison, then the mover", () => {
    const kinds = buildInsights({
      ...base,
      categories: [{ name: "Food", current: 6_000_00, previous: 4_000_00 }],
    }).map((insight) => insight.kind);
    expect(kinds).toEqual(["projection", "pace", "mover"]);
  });
});
