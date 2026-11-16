import { describe, expect, it } from "vitest";
import { filterCounts, matchesFilter, needsCheck, type FilterableRow } from "@/lib/import-filter";

const row = (over: Partial<FilterableRow> = {}): FilterableRow => ({
  suggested: true,
  duplicate: false,
  categoryId: "cat-food",
  ...over,
});

describe("needsCheck", () => {
  it("is false for a recognised merchant", () => {
    expect(needsCheck(row())).toBe(false);
  });

  it("is true when nothing recognised the description", () => {
    expect(needsCheck(row({ suggested: false, categoryId: "cat-other" }))).toBe(true);
  });

  it("is true when there is no category at all, even if a rule matched", () => {
    expect(needsCheck(row({ categoryId: null }))).toBe(true);
  });

  it("is not triggered by a duplicate on its own", () => {
    expect(needsCheck(row({ duplicate: true }))).toBe(false);
  });
});

describe("matchesFilter", () => {
  const sure = row();
  const unsure = row({ suggested: false, categoryId: "cat-other" });
  const dup = row({ duplicate: true });

  it("'all' shows everything", () => {
    expect([sure, unsure, dup].every((r) => matchesFilter(r, "all"))).toBe(true);
  });

  it("'check' shows only rows that need a look", () => {
    expect([sure, unsure, dup].map((r) => matchesFilter(r, "check"))).toEqual([false, true, false]);
  });

  it("'duplicates' shows only rows already saved", () => {
    expect([sure, unsure, dup].map((r) => matchesFilter(r, "duplicates"))).toEqual([false, false, true]);
  });

  it("a row can be both unsure and a duplicate", () => {
    const both = row({ suggested: false, duplicate: true });
    expect(matchesFilter(both, "check")).toBe(true);
    expect(matchesFilter(both, "duplicates")).toBe(true);
  });
});

describe("filterCounts", () => {
  it("counts each view", () => {
    const rows = [
      row(),
      row(),
      row({ suggested: false }),
      row({ categoryId: null }),
      row({ duplicate: true }),
      row({ suggested: false, duplicate: true }),
    ];
    expect(filterCounts(rows)).toEqual({ all: 6, check: 3, duplicates: 2 });
  });

  it("handles an empty list", () => {
    expect(filterCounts([])).toEqual({ all: 0, check: 0, duplicates: 0 });
  });
});
