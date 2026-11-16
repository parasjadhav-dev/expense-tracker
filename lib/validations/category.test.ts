import { describe, expect, it } from "vitest";
import { checkCategoryName, isNameTaken } from "@/lib/validations/category";

describe("checkCategoryName", () => {
  it("trims and collapses spaces", () => {
    expect(checkCategoryName("  Eating   out ")).toEqual({ ok: true, name: "Eating out" });
  });
  it("rejects empty and blank names", () => {
    expect(checkCategoryName("").ok).toBe(false);
    expect(checkCategoryName("   ").ok).toBe(false);
  });
  it("rejects names that are too long, counting emoji as one character", () => {
    expect(checkCategoryName("a".repeat(31)).ok).toBe(false);
    expect(checkCategoryName("a".repeat(30)).ok).toBe(true);
    expect(checkCategoryName("🍕".repeat(30)).ok).toBe(true);
  });
  it("rejects control characters", () => {
    expect(checkCategoryName("Food\nand drink").ok).toBe(false);
    expect(checkCategoryName("Food\tand").ok).toBe(false);
  });
  it("keeps punctuation and other languages", () => {
    expect(checkCategoryName("Kids & school (fees)")).toEqual({ ok: true, name: "Kids & school (fees)" });
    expect(checkCategoryName("खाना")).toEqual({ ok: true, name: "खाना" });
  });
});

describe("isNameTaken", () => {
  const categories = [
    { id: "1", name: "Food" },
    { id: "2", name: "Travel" },
  ];
  it("ignores case", () => {
    expect(isNameTaken(categories, "food")).toBe(true);
    expect(isNameTaken(categories, "Gifts")).toBe(false);
  });
  it("lets a category keep its own name", () => {
    expect(isNameTaken(categories, "Food", "1")).toBe(false);
    expect(isNameTaken(categories, "Food", "2")).toBe(true);
  });
});
