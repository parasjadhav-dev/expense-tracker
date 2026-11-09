"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createRecurring } from "@/app/(app)/recurring/actions";
import type { RecurringFormState } from "@/lib/recurring-form";
import { button, input, label } from "@/lib/ui";

type Category = { id: string; name: string };

const initialState: RecurringFormState = { status: "idle" };

export function RecurringForm({
  categories,
  month,
  minMonth,
}: {
  categories: Category[];
  month: string; // the current month: the default first month and the latest allowed
  minMonth: string; // the earliest first month (12 months back)
}) {
  const [state, formAction, pending] = useActionState(createRecurring, initialState);
  const errors = state.fieldErrors ?? {};
  const values = state.values;

  return (
    <div className="flex flex-col gap-4">
      {state.status === "success" && state.message ? (
        <p
          role="status"
          className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.message}
        </p>
      ) : null}

      {/* A new key after each save clears the fields for the next item. */}
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dayOfMonth" className={label}>
              Day of the month
            </label>
            <input
              id="dayOfMonth"
              name="dayOfMonth"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="1 to 31"
              required
              defaultValue={values?.dayOfMonth}
              aria-invalid={errors.dayOfMonth ? true : undefined}
              aria-describedby="dayOfMonth-hint"
              className={input}
            />
            <p id="dayOfMonth-hint" className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              A shorter month uses its last day.
            </p>
            <FieldError errors={errors.dayOfMonth} />
          </div>

          <div>
            <label htmlFor="startMonth" className={label}>
              First month
            </label>
            <input
              id="startMonth"
              name="startMonth"
              type="month"
              placeholder="YYYY-MM"
              pattern="\d{4}-\d{2}"
              title="Use the format YYYY-MM, for example 2026-11"
              min={minMonth}
              max={month}
              required
              defaultValue={values?.startMonth ?? month}
              aria-invalid={errors.startMonth ? true : undefined}
              className={input}
            />
            <FieldError errors={errors.startMonth} />
          </div>
        </div>

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
            placeholder="Rent, Netflix, gym..."
            defaultValue={values?.note}
            aria-invalid={errors.note ? true : undefined}
            className={input}
          />
          <FieldError errors={errors.note} />
        </div>

        <button type="submit" disabled={pending} className={`${button("primary")} h-11`}>
          {pending ? "Saving..." : "Add recurring expense"}
        </button>
      </form>
    </div>
  );
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[0]}</p>;
}
