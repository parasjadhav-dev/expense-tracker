import { db } from "@/lib/db";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";

// For accounts that exist without categories (created before sign-up started
// adding the defaults). Safe to call repeatedly: it only inserts missing names.
export async function ensureDefaultCategories(userId: string): Promise<void> {
  const existing = await db.category.count({ where: { userId } });
  if (existing > 0) return;

  await db.category.createMany({
    data: DEFAULT_CATEGORIES.map((name) => ({ name, userId })),
    skipDuplicates: true,
  });
}
