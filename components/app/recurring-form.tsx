"use client";

import { FieldError, fieldA11y, useFocusFirstError } from "@/components/ui/field-error";
import { useToastAction } from "@/components/ui/toast";
import { useActionState } from "react";
import { createRecurring } from "@/app/(app)/recurring/actions";
import type { RecurringFormState } from "@/lib/recurring-form";
import { currencySymbol, type CurrencyCode } from "@/lib/currency";
import { button, input, label } from "@/lib/ui";

type Category = { id: string; name: string };

const initialState: RecurringFormState = { status: "idle" };

export function RecurringForm({
  categories,
  month,
  minMonth,
  currency,
}: {
  currency: CurrencyCode;
  categories: Category[];
  month: string; // the current month: the default first month and the latest allowed
  minMonth: string; // the earliest first month (12 months back)
}) {
  const [state, formAction, pending] = useActionState(useToastAction(createRecurring), initialState);
  const formRef = useFocusFirstError(state);
  const errors = state.fieldErrors ?? {};
  const values = state.values;

  return (
    <div className="flex flex-col gap-4">
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      ) : null}

      {/* A new key after each save clears the fields for the next item. */}
      <form ref={formRef}
        key={state.savedAt ?? "form"}
        action={formAction}
        className="flex flex-col gap-4"
        noValidate
      >
        <div>
          <label htmlFor="amount" className={label}>
            Amount ({currencySymbol(currency)})
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
            {...fieldA11y("amount", errors.amount)}
            className={`${input} tabular-nums`}
          />
          <FieldError id="amount" errors={errors.amount} />
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
            {...fieldA11y("categoryId", errors.categoryId)}
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
          <FieldError id="categoryId" errors={errors.categoryId} />
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
              {...fieldA11y("dayOfMonth", errors.dayOfMonth, "dayOfMonth-hint")}
              className={input}
            />
            <p id="dayOfMonth-hint" className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              A shorter month uses its last day.
            </p>
            <FieldError id="dayOfMonth" errors={errors.dayOfMonth} />
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
              {...fieldA11y("startMonth", errors.startMonth)}
              className={input}
            />
            <FieldError id="startMonth" errors={errors.startMonth} />
          </div>
        </div>

        <div>
          <label htmlFor="note" className={label}>
            Note <span className="font-normal text-zinc-600 dark:text-zinc-400">(optional)</span>
          </label>
          <input
            id="note"
            name="note"
            type="text"
            maxLength={200}
            autoComplete="off"
            placeholder="Rent, Netflix, gym..."
            defaultValue={values?.note}
            {...fieldA11y("note", errors.note)}
            className={input}
          />
          <FieldError id="note" errors={errors.note} />
        </div>

        <button type="submit" disabled={pending} className={`${button("primary")} h-11`}>
          {pending ? "Saving..." : "Add recurring expense"}
        </button>
      </form>
    </div>
  );
}

