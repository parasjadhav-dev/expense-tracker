"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryState,
} from "@/app/(app)/settings/category-actions";
import { CategoryBadge } from "./category-badge";
import { CategoryLookPicker } from "./category-look-picker";
import { button, input, label } from "@/lib/ui";
import { CATEGORY_NAME_MAX, MAX_CATEGORIES } from "@/lib/validations/category";

export type CategoryRow = {
  id: string;
  name: string;
  // The look it shows now (saved, or worked out from the name).
  color: number;
  icon: string;
  expenses: number;
  recurring: number;
};

const initialState: CategoryState = { status: "idle" };

function Alert({ state, testId }: { state: CategoryState; testId: string }) {
  if (state.status === "error" && state.message) {
    return (
      <p
        role="alert"
        data-testid={testId}
        className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
      >
        {state.message}
      </p>
    );
  }
  return null;
}

export function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const atLimit = categories.length >= MAX_CATEGORIES;

  return (
    <div className="flex flex-col gap-4">
      <AddCategoryForm disabled={atLimit} />
      <ul
        data-testid="category-list"
        className="grid gap-2 md:grid-cols-2 md:gap-3"
      >
        {categories.map((category) => (
          <CategoryItem
            key={category.id}
            category={category}
            others={categories.filter((other) => other.id !== category.id)}
          />
        ))}
      </ul>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        {categories.length} of {MAX_CATEGORIES} categories. Editing a category
        keeps all its expenses. Deleting one moves its expenses to a category you
        choose.
      </p>
    </div>
  );
}

function AddCategoryForm({ disabled }: { disabled: boolean }) {
  const [state, formAction, pending] = useActionState(createCategory, initialState);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3"
      noValidate
      // A new key after each save puts the colour and icon back to automatic.
      key={state.status === "success" ? `added-${state.message}` : "add"}
    >
      {state.status === "success" && state.message ? (
        <p
          role="status"
          data-testid="category-success"
          className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}
      <Alert state={state} testId="category-error" />
      <div>
        <label htmlFor="new-category" className={label}>
          New category
        </label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <input
            id="new-category"
            name="name"
            type="text"
            maxLength={CATEGORY_NAME_MAX}
            placeholder="For example Gifts or Pets"
            autoComplete="off"
            // Put back what was typed after a failed save.
            key={state.status === "error" ? `e-${state.name}` : "ok"}
            defaultValue={state.status === "error" ? state.name : ""}
            disabled={disabled}
            className={`${input} sm:flex-1`}
          />
          <button
            type="submit"
            disabled={pending || disabled}
            className={`${button("primary")} sm:mt-1.5`}
          >
            <Plus className="size-4" aria-hidden="true" />
            {pending ? "Adding..." : "Add category"}
          </button>
        </div>
      </div>
      <details className="group rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
        <summary className="cursor-pointer select-none text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Choose a colour and icon{" "}
          <span className="font-normal text-zinc-500 dark:text-zinc-400">(optional)</span>
        </summary>
        <div className="mt-3">
          <CategoryLookPicker idPrefix="new" initialColor={null} initialIcon={null} optional />
        </div>
      </details>
    </form>
  );
}

function CategoryItem({
  category,
  others,
}: {
  category: CategoryRow;
  others: CategoryRow[];
}) {
  const [editing, setEditing] = useState(false);
  const used = category.expenses + category.recurring;
  const counts = [
    `${category.expenses} ${category.expenses === 1 ? "expense" : "expenses"}`,
    category.recurring > 0 ? `${category.recurring} recurring` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      data-testid="category-item"
      className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
    >
      {editing ? (
        <EditForm category={category} onDone={() => setEditing(false)} />
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <CategoryBadge
            name={category.name}
            looks={{ [category.name.toLowerCase()]: { color: category.color, icon: category.icon } }}
          />
          <div className="min-w-0 flex-1 basis-32">
            <p
              data-testid="category-name"
              className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50"
            >
              {category.name}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{counts}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              aria-label={`Edit ${category.name}`}
              className={button("secondary", "sm")}
            >
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </button>
            <DeleteCategoryButton category={category} others={others} used={used} />
          </div>
        </div>
      )}
    </li>
  );
}

function EditForm({
  category,
  onDone,
}: {
  category: CategoryRow;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateCategory, initialState);

  useEffect(() => {
    if (state.status === "success") onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-2" noValidate>
      <input type="hidden" name="id" value={category.id} />
      <Alert state={state} testId="rename-error" />
      <label htmlFor={`rename-${category.id}`} className="sr-only">
        New name for {category.name}
      </label>
      <input
        id={`rename-${category.id}`}
        name="name"
        type="text"
        maxLength={CATEGORY_NAME_MAX}
        autoComplete="off"
        autoFocus
        key={state.status === "error" ? `e-${state.name}` : "ok"}
        defaultValue={state.status === "error" ? state.name : category.name}
        className={`${input} mt-0`}
      />
      <CategoryLookPicker
        idPrefix={`edit-${category.id}`}
        initialColor={category.color}
        initialIcon={category.icon}
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className={`${button("primary", "sm")} flex-1 sm:flex-none`}
        >
          {pending ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className={`${button("secondary", "sm")} flex-1 sm:flex-none`}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function DeleteCategoryButton({
  category,
  others,
  used,
}: {
  category: CategoryRow;
  others: CategoryRow[];
  used: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(deleteCategory, initialState);
  const lastOne = others.length === 0;

  useEffect(() => {
    if (state.status === "success") dialogRef.current?.close();
  }, [state]);

  const titleId = `delete-category-${category.id}`;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        aria-label={`Delete ${category.name}`}
        className={button("dangerOutline", "sm")}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Delete
      </button>

      {/* m-auto: Tailwind's reset removes the margin that centers a modal dialog. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[min(92vw,26rem)] rounded-2xl bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/50 backdrop:backdrop-blur-[2px] dark:bg-zinc-900 dark:text-zinc-50"
      >
        <form action={formAction} className="p-6 text-left">
          <input type="hidden" name="id" value={category.id} />
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            Delete &ldquo;{category.name}&rdquo;?
          </h2>

          {lastOne ? (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              This is your only category. Add another one first, then you can
              delete this one.
            </p>
          ) : used > 0 ? (
            <div className="mt-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {used} {used === 1 ? "item uses" : "items use"} this category. Move{" "}
                {used === 1 ? "it" : "them"} to:
              </p>
              <label htmlFor={`move-${category.id}`} className="sr-only">
                Move to
              </label>
              <select
                id={`move-${category.id}`}
                name="moveToId"
                required
                defaultValue={others[0].id}
                className={input}
              >
                {others.map((other) => (
                  <option key={other.id} value={other.id}>
                    {other.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              No expenses use this category.
            </p>
          )}
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Its monthly budgets are deleted too. This can&apos;t be undone.
          </p>

          {state.status === "error" && state.message ? (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {state.message}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className={`${button("secondary")} flex-1 sm:flex-none`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending || lastOne}
              className={`${button("danger")} flex-1 sm:flex-none`}
            >
              {pending ? "Deleting..." : used > 0 ? "Move and delete" : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
