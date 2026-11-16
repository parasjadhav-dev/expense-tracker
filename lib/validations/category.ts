// Rules for category names. Pure, so it is tested without a database.

export const CATEGORY_NAME_MAX = 30;
export const MAX_CATEGORIES = 50;

// Tabs, newlines and other control characters have no business in a name.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export type CategoryNameResult =
  | { ok: true; name: string }
  | { ok: false; message: string };

// "  Eating   out " -> "Eating out"
export function checkCategoryName(raw: string): CategoryNameResult {
  if (CONTROL_CHARACTERS.test(raw)) {
    return { ok: false, message: "Category names cannot contain line breaks or tabs." };
  }
  const name = raw.replace(/\s+/g, " ").trim();
  if (name === "") return { ok: false, message: "Enter a category name." };
  if ([...name].length > CATEGORY_NAME_MAX) {
    return { ok: false, message: `Keep the name to ${CATEGORY_NAME_MAX} characters or fewer.` };
  }
  return { ok: true, name };
}

// "food" and "Food" are the same category to a person, though the database
// would treat them as two. exceptId lets a category keep its own name when renamed.
export function isNameTaken(
  categories: readonly { id: string; name: string }[],
  name: string,
  exceptId?: string,
): boolean {
  const wanted = name.toLowerCase();
  return categories.some(
    (category) => category.id !== exceptId && category.name.toLowerCase() === wanted,
  );
}
