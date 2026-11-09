// Pure maths for the "spending by category" chart: rank the categories, fold the
// small ones together and work out each share. No database, no clock, no imports.
//
// Amounts are integer paise. Shares are kept in tenths of a percent (0..1000) and
// worked out with integer arithmetic, so they add up to exactly 100.0% and never
// pick up float rounding errors.

// Most bars the chart draws. With more categories than this, the smallest are
// folded into one "All other" bar so the chart stays readable.
export const MAX_BARS = 8;

export type BreakdownInput = { id: string; name: string; spent: number };

export type BreakdownRow = {
  key: string; // the category id, or OTHER_KEY for the folded bar
  name: string;
  amount: number;
  tenths: number; // share of the total, in tenths of a percent
  isOther: boolean;
  count: number; // how many categories this row stands for
};

export const OTHER_KEY = "__other__";
export const OTHER_NAME = "All other";

export type CategoryBreakdown = {
  total: number;
  // What the chart draws: largest first, tail folded into one "All other" row.
  rows: BreakdownRow[];
  // Every category with spending, largest first. Backs the table view, so the
  // folded categories stay readable one by one.
  allRows: BreakdownRow[];
};

function byAmountThenName(
  a: { amount: number; name: string },
  b: { amount: number; name: string },
): number {
  if (a.amount !== b.amount) return b.amount - a.amount;
  if (a.name === b.name) return 0;
  return a.name < b.name ? -1 : 1;
}

// Largest-remainder split of 1000 tenths across the amounts. Remainders are
// compared as exact integers (amount * 1000 % total), never as floats.
function shareInTenths(
  items: { amount: number; name: string }[],
  total: number,
): number[] {
  const floors = items.map((item) => Math.floor((item.amount * 1000) / total));
  let left = 1000 - floors.reduce((sum, value) => sum + value, 0);

  const order = items
    .map((item, index) => ({
      index,
      remainder: (item.amount * 1000) % total,
      amount: item.amount,
      name: item.name,
    }))
    .sort((a, b) => b.remainder - a.remainder || byAmountThenName(a, b));

  const tenths = [...floors];
  for (const entry of order) {
    if (left <= 0) break;
    tenths[entry.index] += 1;
    left -= 1;
  }
  return tenths;
}

export function buildCategoryBreakdown(
  categories: readonly BreakdownInput[],
  maxBars: number = MAX_BARS,
): CategoryBreakdown {
  const spending = categories
    .filter((category) => category.spent > 0)
    .map((category) => ({
      key: category.id,
      name: category.name,
      amount: category.spent,
    }))
    .sort(byAmountThenName);

  const total = spending.reduce((sum, item) => sum + item.amount, 0);
  if (total === 0) return { total: 0, rows: [], allRows: [] };

  const tenths = shareInTenths(spending, total);
  const allRows: BreakdownRow[] = spending.map((item, index) => ({
    key: item.key,
    name: item.name,
    amount: item.amount,
    tenths: tenths[index],
    isOther: false,
    count: 1,
  }));

  // Folding keeps the shares consistent with the table: the "All other" share
  // is the sum of the shares it replaces, not a fresh calculation.
  const limit = Math.max(2, Math.floor(maxBars));
  if (allRows.length <= limit) return { total, rows: allRows, allRows };

  const shown = allRows.slice(0, limit - 1);
  const folded = allRows.slice(limit - 1);
  const other: BreakdownRow = {
    key: OTHER_KEY,
    name: OTHER_NAME,
    amount: folded.reduce((sum, row) => sum + row.amount, 0),
    tenths: folded.reduce((sum, row) => sum + row.tenths, 0),
    isOther: true,
    count: folded.length,
  };
  return { total, rows: [...shown, other], allRows };
}

// 713 -> "71.3%"
export function formatTenths(tenths: number): string {
  return `${(tenths / 10).toFixed(1)}%`;
}
