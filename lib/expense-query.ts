import { parseRupeesToPaise } from "@/lib/money";

// What the expenses list reads from the address bar: a search text, a sort order
// and a page number. Everything here is pure, so it is tested without a database.
// Anything unrecognised falls back to the default, so a hand-edited URL never errors.

export const PAGE_SIZE = 25;
export const MAX_SEARCH_LENGTH = 80;

export const SORT_KEYS = ["date-desc", "date-asc", "amount-desc", "amount-asc"] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export const DEFAULT_SORT: SortKey = "date-desc";

export const SORT_LABELS: Record<SortKey, string> = {
  "date-desc": "Newest first",
  "date-asc": "Oldest first",
  "amount-desc": "Highest amount",
  "amount-asc": "Lowest amount",
};

export function parseSort(value: string | undefined): SortKey {
  return SORT_KEYS.find((key) => key === value) ?? DEFAULT_SORT;
}

// Trimmed, whitespace collapsed, and capped, so the query stays small.
export function parseSearch(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_SEARCH_LENGTH);
}

// "3" -> 3. Zero, negatives, decimals and junk -> 1.
export function parsePage(value: string | undefined): number {
  if (!value || !/^\d{1,6}$/.test(value)) return 1;
  return Math.max(1, Number(value));
}

export function pageCount(count: number, pageSize: number = PAGE_SIZE): number {
  return Math.max(1, Math.ceil(count / pageSize));
}

// A page past the end (after deleting the last row of the last page, say) shows
// the last page instead of an empty one.
export function clampPage(page: number, count: number, pageSize: number = PAGE_SIZE): number {
  return Math.min(Math.max(1, page), pageCount(count, pageSize));
}

// Ties are broken the same way every time, so a row never shows up on two pages
// or on none while someone pages through.
export function orderByFor(sort: SortKey) {
  const tail = [{ createdAt: "desc" as const }, { id: "desc" as const }];
  switch (sort) {
    case "date-asc":
      return [{ date: "asc" as const }, ...tail];
    case "amount-desc":
      return [{ amount: "desc" as const }, { date: "desc" as const }, ...tail];
    case "amount-asc":
      return [{ amount: "asc" as const }, { date: "desc" as const }, ...tail];
    default:
      return [{ date: "desc" as const }, ...tail];
  }
}

// The text matches a note or a category name, ignoring case. Text that looks like
// an amount ("450" or "450.50") also finds expenses of exactly that amount.
export function searchConditions(text: string) {
  if (!text) return [];
  const conditions: object[] = [
    { note: { contains: text, mode: "insensitive" } },
    { category: { name: { contains: text, mode: "insensitive" } } },
  ];
  if (/^\d+(\.\d{1,2})?$/.test(text)) {
    const amount = parseRupeesToPaise(text);
    if (amount.ok) conditions.push({ amount: amount.paise });
  }
  return conditions;
}

export type ExpenseQuery = {
  month: string | null; // null = all months
  categoryId: string | null;
  q: string;
  sort: SortKey;
  page: number;
};

// The /expenses address for a query. Defaults are left out to keep it short. The
// month is always written, because "no month" has to be told apart from "this month".
export function expensesHref(query: ExpenseQuery): string {
  const params = new URLSearchParams();
  params.set("month", query.month ?? "");
  if (query.categoryId) params.set("category", query.categoryId);
  if (query.q) params.set("q", query.q);
  if (query.sort !== DEFAULT_SORT) params.set("sort", query.sort);
  if (query.page > 1) params.set("page", String(query.page));
  return `/expenses?${params.toString()}`;
}
