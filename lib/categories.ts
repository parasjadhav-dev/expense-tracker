import { db } from "@/lib/db";
import { looksByName, type CategoryLooks } from "@/lib/category-style";
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

// The user's saved category colours and icons, keyed by lowercase name. Pass the
// result to the components that draw category badges, pills and charts.
export async function getCategoryLooks(userId: string): Promise<CategoryLooks> {
  const rows = await db.category.findMany({
    where: { userId },
    select: { name: true, color: true, icon: true },
  });
  return looksByName(rows);
}
