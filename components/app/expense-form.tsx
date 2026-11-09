"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import type {
  ExpenseFormState,
  ExpenseFormValues,
} from "@/lib/expense-form";
import { button, input, label } from "@/lib/ui";

type Category = { id: string; name: string };

type ExpenseAction = (
  prevState: ExpenseFormState,
  formData: FormData,
) => Promise<ExpenseFormState>;

const initialState: ExpenseFormState = { status: "idle" };

// Used for both adding and editing an expense.
export function ExpenseForm({
  categories,
  action,
  initialValues,
  submitLabel,
  pendingLabel,
  cancelHref,
  today,
}: {
  // "YYYY-MM-DD" in the app time zone: the default date and the latest allowed.
  today: string;
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
          className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
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
          <label htmlFor="amount" className={label}>
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
            className={`${input} text-base tabular-nums`}
          />
          <FieldError errors={errors.amount} />
        </div>

        <div>
          <label htmlFor="categoryId" className={label}>
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
            className={input}
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

        <DateField
          defaultValue={values?.date ?? today}
          max={today}
          errors={errors.date}
        />

        <div>
          <label htmlFor="note" className={label}>
            Note <span className="font-normal text-zinc-500">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            maxLength={200}
            autoComplete="off"
            placeholder="What was it for?"
            defaultValue={values?.note}
            aria-invalid={errors.note ? true : undefined}
            className={input}
          />
          <FieldError errors={errors.note} />
        </div>

        <div className="mt-2 flex gap-3">
          <button
            type="submit"
            disabled={pending}
            className={`${button("primary")} flex-1`}
          >
            {pending ? pendingLabel : submitLabel}
          </button>
          {cancelHref ? (
            <Link href={cancelHref} className={button("secondary")}>
              Cancel
            </Link>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function DateField({
  defaultValue,
  max,
  errors,
}: {
  defaultValue?: string;
  max: string;
  errors?: string[];
}) {
  return (
    <div>
      <label htmlFor="date" className={label}>
        Date
      </label>
      <input
        id="date"
        name="date"
        type="date"
        required
        max={max}
        defaultValue={defaultValue}
        aria-invalid={errors ? true : undefined}
        className={input}
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
