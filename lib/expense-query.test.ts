import { describe, expect, it } from "vitest";
import {
  PAGE_SIZE,
  clampPage,
  expensesHref,
  orderByFor,
  pageCount,
  parsePage,
  parseSearch,
  parseSort,
  searchConditions,
} from "@/lib/expense-query";

describe("parseSort", () => {
  it("accepts the known orders", () => {
    expect(parseSort("amount-desc")).toBe("amount-desc");
    expect(parseSort("date-asc")).toBe("date-asc");
  });
  it("falls back to newest first", () => {
    expect(parseSort(undefined)).toBe("date-desc");
    expect(parseSort("; drop table")).toBe("date-desc");
    expect(parseSort("")).toBe("date-desc");
  });
});

describe("parseSearch", () => {
  it("trims and collapses whitespace", () => {
    expect(parseSearch("  big   bazaar ")).toBe("big bazaar");
  });
  it("is empty when missing", () => {
    expect(parseSearch(undefined)).toBe("");
  });
  it("is capped in length", () => {
    expect(parseSearch("a".repeat(500))).toHaveLength(80);
  });
});

describe("parsePage", () => {
  it("reads a positive whole number", () => {
    expect(parsePage("3")).toBe(3);
  });
  it("falls back to 1 for anything else", () => {
    for (const bad of [undefined, "", "0", "-2", "1.5", "abc", "2e3", "99999999"]) {
      expect(parsePage(bad), String(bad)).toBe(1);
    }
  });
});

describe("paging maths", () => {
  it("counts pages, with at least one", () => {
    expect(pageCount(0)).toBe(1);
    expect(pageCount(PAGE_SIZE)).toBe(1);
    expect(pageCount(PAGE_SIZE + 1)).toBe(2);
    expect(pageCount(100, 25)).toBe(4);
  });
  it("pulls a page past the end back to the last page", () => {
    expect(clampPage(9, 60)).toBe(3);
    expect(clampPage(2, 60)).toBe(2);
    expect(clampPage(5, 0)).toBe(1);
    expect(clampPage(0, 60)).toBe(1);
  });
});

describe("orderByFor", () => {
  it("always ends with a unique tie-breaker so pages never overlap", () => {
    for (const key of ["date-desc", "date-asc", "amount-desc", "amount-asc"] as const) {
      const order = orderByFor(key);
      expect(order[order.length - 1]).toEqual({ id: "desc" });
    }
  });
  it("puts the chosen field first", () => {
    expect(orderByFor("amount-asc")[0]).toEqual({ amount: "asc" });
    expect(orderByFor("date-asc")[0]).toEqual({ date: "asc" });
    expect(orderByFor("date-desc")[0]).toEqual({ date: "desc" });
  });
});

describe("searchConditions", () => {
  it("is empty for no text", () => {
    expect(searchConditions("")).toEqual([]);
  });
  it("matches notes and category names, ignoring case", () => {
    const conditions = searchConditions("swiggy");
    expect(conditions).toContainEqual({ note: { contains: "swiggy", mode: "insensitive" } });
    expect(conditions).toContainEqual({
      category: { name: { contains: "swiggy", mode: "insensitive" } },
    });
    expect(conditions).toHaveLength(2);
  });
  it("also matches an exact amount when the text looks like one", () => {
    expect(searchConditions("450")).toContainEqual({ amount: 45000 });
    expect(searchConditions("450.5")).toContainEqual({ amount: 45050 });
  });
  it("does not treat other text as an amount", () => {
    expect(searchConditions("450 rs")).toHaveLength(2);
    expect(searchConditions("0")).toHaveLength(2);
  });
});

describe("expensesHref", () => {
  const base = { month: "2026-11", categoryId: null, q: "", sort: "date-desc" as const, page: 1 };
  it("leaves defaults out", () => {
    expect(expensesHref(base)).toBe("/expenses?month=2026-11");
  });
  it("writes an empty month for all months", () => {
    expect(expensesHref({ ...base, month: null })).toBe("/expenses?month=");
  });
  it("includes everything that is set, encoded", () => {
    const href = expensesHref({ month: null, categoryId: "c1", q: "big bazaar & co", sort: "amount-desc", page: 3 });
    const params = new URL(href, "http://x").searchParams;
    expect(params.get("month")).toBe("");
    expect(params.get("category")).toBe("c1");
    expect(params.get("q")).toBe("big bazaar & co");
    expect(params.get("sort")).toBe("amount-desc");
    expect(params.get("page")).toBe("3");
  });
});
