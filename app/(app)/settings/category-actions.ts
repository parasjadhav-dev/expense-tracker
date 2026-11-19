"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SAVE_FAILED_MESSAGE, logActionError } from "@/lib/action-errors";
import { pickColorForNew, resolveLook } from "@/lib/category-style";
import {
  MAX_CATEGORIES,
  checkCategoryLook,
  checkCategoryName,
  isNameTaken,
} from "@/lib/validations/category";

export type CategoryState = {
  status: "idle" | "success" | "error";
  message?: string;
  // What was typed, so a failed save can put it back.
  name?: string;
};

const SESSION_ENDED: CategoryState = {
  status: "error",
  message: "Your session has ended. Please log in again.",
};

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === code;
}

// Category names show on every page (lists, forms, charts, budgets), and the
// import page reads them too.
function refresh(): void {
  revalidatePath("/", "layout");
}

// Checked in every action, not only in proxy.ts: server actions are POST
// requests that proxy matchers can miss. The category ids below come from the
// browser, so every query is also scoped to the signed-in user.
export async function createCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SESSION_ENDED;

  const typed = text(formData, "name");
  const checked = checkCategoryName(typed);
  if (!checked.ok) return { status: "error", message: checked.message, name: typed };
  const look = checkCategoryLook(text(formData, "color"), text(formData, "icon"));
  if (!look.ok) return { status: "error", message: look.message, name: typed };

  try {
    const existing = await db.category.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, icon: true },
    });
    if (existing.length >= MAX_CATEGORIES) {
      return {
        status: "error",
        message: `You can have up to ${MAX_CATEGORIES} categories. Delete one you no longer use first.`,
        name: typed,
      };
    }
    if (isNameTaken(existing, checked.name)) {
      return { status: "error", message: `You already have a category called "${checked.name}".`, name: typed };
    }
    // No colour chosen: take one no other category is using, so two do not look alike.
    const color =
      look.color ??
      pickColorForNew(existing.map((item) => resolveLook(item.name, item).color));
    await db.category.create({
      data: { userId, name: checked.name, color, icon: look.icon },
    });
  } catch (error) {
    if (hasCode(error, "P2002")) {
      return { status: "error", message: `You already have a category called "${checked.name}".`, name: typed };
    }
    logActionError("createCategory", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE, name: typed };
  }

  refresh();
  return { status: "success", message: `Added "${checked.name}".` };
}

// Changes a category's name, colour and icon together. A category that never had
// a colour or icon saved keeps the look it is showing now, so renaming it does
// not change how it looks.
export async function updateCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SESSION_ENDED;

  const id = text(formData, "id");
  const typed = text(formData, "name");
  const checked = checkCategoryName(typed);
  if (!checked.ok) return { status: "error", message: checked.message, name: typed };
  const look = checkCategoryLook(text(formData, "color"), text(formData, "icon"));
  if (!look.ok) return { status: "error", message: look.message, name: typed };

  try {
    const existing = await db.category.findMany({
      where: { userId },
      select: { id: true, name: true, color: true, icon: true },
    });
    const current = existing.find((category) => category.id === id);
    if (!current) {
      return { status: "error", message: "This category no longer exists.", name: typed };
    }
    if (isNameTaken(existing, checked.name, id)) {
      return { status: "error", message: `You already have a category called "${checked.name}".`, name: typed };
    }
    const shown = resolveLook(current.name, current);
    await db.category.updateMany({
      where: { id, userId },
      data: {
        name: checked.name,
        color: look.color ?? shown.color,
        icon: look.icon ?? shown.icon,
      },
    });
  } catch (error) {
    if (hasCode(error, "P2002")) {
      return { status: "error", message: `You already have a category called "${checked.name}".`, name: typed };
    }
    logActionError("updateCategory", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE, name: typed };
  }

  refresh();
  return { status: "success", message: `Saved "${checked.name}".` };
}

// A category in use cannot simply disappear: its expenses and recurring items
// are moved to another of the user's categories first, in the same transaction.
// Its monthly budgets are deleted with it.
export async function deleteCategory(
  _prevState: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return SESSION_ENDED;

  const id = text(formData, "id");
  const moveToId = text(formData, "moveToId");

  try {
    const existing = await db.category.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const category = existing.find((item) => item.id === id);
    if (!category) return { status: "error", message: "This category no longer exists." };
    if (existing.length <= 1) {
      return { status: "error", message: "You need at least one category, so this one cannot be deleted." };
    }

    if (moveToId) {
      if (moveToId === id || !existing.some((item) => item.id === moveToId)) {
        return { status: "error", message: "Choose one of your other categories to move the expenses to." };
      }
      await db.$transaction([
        db.expense.updateMany({ where: { userId, categoryId: id }, data: { categoryId: moveToId } }),
        db.recurringExpense.updateMany({ where: { userId, categoryId: id }, data: { categoryId: moveToId } }),
        db.category.deleteMany({ where: { id, userId } }),
      ]);
    } else {
      // Fails (P2003) if anything still uses it, which is reported below.
      await db.category.deleteMany({ where: { id, userId } });
    }
  } catch (error) {
    if (hasCode(error, "P2003")) {
      return {
        status: "error",
        message: "This category is still in use. Choose where to move its expenses.",
      };
    }
    logActionError("deleteCategory", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE };
  }

  refresh();
  return { status: "success" };
}
