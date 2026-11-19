import { describe, expect, it } from "vitest";
import { CATEGORY_COLOR_COUNT, getCategoryStyle } from "./category-style";
import { DEFAULT_CATEGORIES } from "./default-categories";

describe("getCategoryStyle", () => {
  it("gives every default category its own colour", () => {
    const colors = DEFAULT_CATEGORIES.map((name) => getCategoryStyle(name).colorIndex);
    expect(new Set(colors).size).toBe(DEFAULT_CATEGORIES.length);
  });

  it("ignores case and surrounding spaces", () => {
    expect(getCategoryStyle("  FOOD ").colorIndex).toBe(getCategoryStyle("Food").colorIndex);
  });

  it("is the same every time for a custom name, and stays in range", () => {
    const first = getCategoryStyle("Pottery class");
    expect(getCategoryStyle("Pottery class").colorIndex).toBe(first.colorIndex);
    expect(first.colorIndex).toBeGreaterThanOrEqual(0);
    expect(first.colorIndex).toBeLessThan(CATEGORY_COLOR_COUNT);
  });

  it("never gives a custom category the grey used for Other", () => {
    const other = getCategoryStyle("Other").colorIndex;
    for (const name of ["a", "b", "Gym", "Pets", "Zebra", "Taxes", "x1", "x2", "x3"]) {
      expect(getCategoryStyle(name).colorIndex).not.toBe(other);
    }
  });

  it("picks an icon from a keyword in a custom name", () => {
    expect(getCategoryStyle("Gym membership").icon).toBe(getCategoryStyle("Fitness").icon);
    expect(getCategoryStyle("Gym membership").icon).not.toBe(getCategoryStyle("Zzz").icon);
  });
});
