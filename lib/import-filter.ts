// Which rows of an import preview to show. Pure: no imports, so it is easy to test.
//
// A statement can have hundreds of lines. Most are recognised merchants (Swiggy,
// Uber...) that need no attention, so the preview can be narrowed to the ones
// worth a look.

export type ImportFilter = "all" | "check" | "duplicates";

export type FilterableRow = {
  suggested: boolean; // a keyword rule recognised the description
  duplicate: boolean; // already saved in the account
  categoryId: string | null; // the suggestion made when the file was read
};

// "To check": nothing recognised the description (so it was filed under Other),
// or there is no category for it at all. Based on what was suggested, not on the
// user's later edits, so a row does not vanish from the list the moment they fix it.
export function needsCheck(row: FilterableRow): boolean {
  return !row.suggested || row.categoryId === null;
}

export function matchesFilter(row: FilterableRow, filter: ImportFilter): boolean {
  switch (filter) {
    case "all":
      return true;
    case "check":
      return needsCheck(row);
    case "duplicates":
      return row.duplicate;
  }
}

export function filterCounts(rows: FilterableRow[]): Record<ImportFilter, number> {
  return {
    all: rows.length,
    check: rows.filter(needsCheck).length,
    duplicates: rows.filter((row) => row.duplicate).length,
  };
}
