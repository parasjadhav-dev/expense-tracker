import { describe, expect, it } from "vitest";
import {
  CATEGORY_COLOR_COUNT,
  CATEGORY_ICON_KEYS,
  getCategoryStyle,
  looksByName,
  pickColorForNew,
  resolveLook,
} from "./category-style";
import { checkCategoryLook } from "./validations/category";
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

describe("saved looks", () => {
  it("a saved colour and icon win over the name", () => {
    expect(resolveLook("Food", { color: 5, icon: "gift" })).toEqual({ color: 5, icon: "gift" });
  });

  it("falls back to the name for anything not saved or not valid", () => {
    const derived = resolveLook("Food");
    expect(resolveLook("Food", { color: null, icon: null })).toEqual(derived);
    expect(resolveLook("Food", { color: 99, icon: "nope" })).toEqual(derived);
  });

  it("looks up by lowercase name", () => {
    const looks = looksByName([{ name: "Pottery", color: 3, icon: "gift" }]);
    expect(getCategoryStyle("POTTERY", looks).colorIndex).toBe(3);
    expect(getCategoryStyle("POTTERY", looks).iconKey).toBe("gift");
  });

  it("every icon key in the picker resolves to itself", () => {
    for (const key of CATEGORY_ICON_KEYS) {
      expect(getCategoryStyle("x", { x: { color: 0, icon: key } }).iconKey).toBe(key);
    }
  });
});

describe("pickColorForNew", () => {
  it("takes a colour nobody uses", () => {
    const used = [8, 10, 11];
    expect(used).not.toContain(pickColorForNew(used));
  });

  it("takes the least used colour once every colour is taken", () => {
    const all = Array.from({ length: CATEGORY_COLOR_COUNT }, (_, i) => i);
    expect(pickColorForNew([...all, ...all.filter((c) => c !== 4)])).toBe(4);
  });
});

describe("checkCategoryLook", () => {
  it("accepts empty values as not chosen", () => {
    expect(checkCategoryLook("", "")).toEqual({ ok: true, color: null, icon: null });
  });
  it("accepts a palette index and an icon key", () => {
    expect(checkCategoryLook("7", "gift")).toEqual({ ok: true, color: 7, icon: "gift" });
  });
  it("refuses out-of-range, non-numeric and unknown values", () => {
    expect(checkCategoryLook("12", "").ok).toBe(false);
    expect(checkCategoryLook("-1", "").ok).toBe(false);
    expect(checkCategoryLook("1.5", "").ok).toBe(false);
    expect(checkCategoryLook("abc", "").ok).toBe(false);
    expect(checkCategoryLook("", "../etc").ok).toBe(false);
    expect(checkCategoryLook("", "constructor").ok).toBe(false);
  });
});
