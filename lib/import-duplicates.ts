// Decides which rows of an import are already in the account, so importing the
// same file twice adds nothing.
//
// Two expenses are "the same" when date, amount and note match (the note ignores
// case and extra spaces). Counting matters: if the account already holds one
// "2026-10-05 | 20.00 | Chai" and the file lists two, the first is a duplicate and
// the second is a genuine second purchase, so it is kept. Re-importing the whole
// file then marks both as duplicates, because the account now holds two.

export type Comparable = { date: string; amount: number; note: string | null };

export function duplicateKey(row: Comparable): string {
  const note = (row.note ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  return `${row.date}|${row.amount}|${note}`;
}

// One flag per incoming row, in order.
export function markDuplicates(
  incoming: readonly Comparable[],
  existing: readonly Comparable[],
): boolean[] {
  const available = new Map<string, number>();
  for (const row of existing) {
    const key = duplicateKey(row);
    available.set(key, (available.get(key) ?? 0) + 1);
  }
  return incoming.map((row) => {
    const key = duplicateKey(row);
    const left = available.get(key) ?? 0;
    if (left === 0) return false;
    available.set(key, left - 1);
    return true;
  });
}
