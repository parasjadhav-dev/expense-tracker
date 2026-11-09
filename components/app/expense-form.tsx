"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import type {
  ExpenseFormState,
  ExpenseFormValues,
} from "@/lib/expense-form";

type Category = { id: string; name: string };

type ExpenseAction = (
  prevState: ExpenseFormState,
  formData: FormData,
) => Promise<ExpenseFormState>;

const initialState: ExpenseFormState = { status: "idle" };

const inputClass =
  "mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

function localToday(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// Used for both adding and editing an expense.
export function ExpenseForm({
  categories,
  action,
  initialValues,
  submitLabel,
  pendingLabel,
  cancelHref,
}: {
  categories: Category[];
  action: ExpenseAction;
  initialValues?: ExpenseFormValues;
  submitLabel: string;
  pendingLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const errors = state.fieldErrors ?? {};
  // After an error the submitted values come back; otherwise use the starting ones.
  const values = state.values ?? initialValues;

  return (
    <div className="flex flex-col gap-4">
      {state.status === "success" && state.message ? (
        <p
          role="status"
          className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800 dark:bg-green-950 dark:text-green-300"
        >
          {state.message}
        </p>
      ) : null}
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}

      {/* A new key after each save clears the fields for the next expense. */}
      <form
        key={state.savedAt ?? "form"}
        action={formAction}
        className="flex flex-col gap-4"
        noValidate
      >
        <div>
          <label htmlFor="amount" className="text-sm font-medium">
            Amount (₹)
          </label>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            required
            defaultValue={values?.amount}
            aria-invalid={errors.amount ? true : undefined}
            className={`${inputClass} tabular-nums`}
          />
          <FieldError errors={errors.amount} />
        </div>

        <div>
          <label htmlFor="categoryId" className="text-sm font-medium">
            Category
          </label>
          {/* The key remounts the select so React 19's post-action form reset
              restores the returned choice instead of the placeholder. */}
          <select
            key={values?.categoryId ?? "none"}
            id="categoryId"
            name="categoryId"
            required
            defaultValue={values?.categoryId ?? ""}
            aria-invalid={errors.categoryId ? true : undefined}
            className={inputClass}
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <FieldError errors={errors.categoryId} />
        </div>

        <DateField defaultValue={values?.date} errors={errors.date} />

        <div>
          <label htmlFor="note" className="text-sm font-medium">
            Note <span className="text-zinc-500">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            maxLength={200}
            autoComplete="off"
            defaultValue={values?.note}
            aria-invalid={errors.note ? true : undefined}
            className={inputClass}
          />
          <FieldError errors={errors.note} />
        </div>

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className="h-10 flex-1 rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-300"
          >
            {pending ? pendingLabel : submitLabel}
          </button>
          {cancelHref ? (
            <Link
              href={cancelHref}
              className="inline-flex h-10 items-center rounded-md border border-zinc-300 px-4 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}

// Defaults to the user's local "today" when no date is given, which the server
// cannot know. It is set after mount to avoid a server/client mismatch.
function DateField({
  defaultValue,
  errors,
}: {
  defaultValue?: string;
  errors?: string[];
}) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = ref.current;
    if (!input) return;
    const today = localToday();
    input.max = today;
    if (!input.value) input.value = today;
  }, []);

  return (
    <div>
      <label htmlFor="date" className="text-sm font-medium">
        Date
      </label>
      <input
        ref={ref}
        id="date"
        name="date"
        type="date"
        required
        defaultValue={defaultValue}
        aria-invalid={errors ? true : undefined}
        className={inputClass}
      />
      <FieldError errors={errors} />
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[0]}</p>
  );
}
