"use client";

import { FieldError, fieldA11y, useFocusFirstError } from "@/components/ui/field-error";
import Link from "next/link";
import { useActionState } from "react";
import type {
  ExpenseFormState,
  ExpenseFormValues,
} from "@/lib/expense-form";
import { currencySymbol, type CurrencyCode } from "@/lib/currency";
import { useToastAction } from "@/components/ui/toast";
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
  currency,
}: {
  currency: CurrencyCode;
  // "YYYY-MM-DD" in the app time zone: the default date and the latest allowed.
  today: string;
  categories: Category[];
  action: ExpenseAction;
  initialValues?: ExpenseFormValues;
  submitLabel: string;
  pendingLabel: string;
  cancelHref?: string;
}) {
  const [state, formAction, pending] = useActionState(useToastAction(action), initialState);
  const formRef = useFocusFirstError(state);
  const errors = state.fieldErrors ?? {};
  // After an error the submitted values come back; otherwise use the starting ones.
  const values = state.values ?? initialValues;

  return (
    <div className="flex flex-col gap-4">
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      ) : null}

      {/* A new key after each save clears the fields for the next expense. */}
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
          {/* The key remounts the select so React 19's post-action form reset
              restores the returned choice instead of the placeholder. */}
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

        <DateField
          defaultValue={values?.date ?? today}
          max={today}
          errors={errors.date}
        />

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
            placeholder="What was it for?"
            defaultValue={values?.note}
            {...fieldA11y("note", errors.note)}
            className={input}
          />
          <FieldError id="note" errors={errors.note} />
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
        {...fieldA11y("date", errors)}
        className={input}
      />
      <FieldError id="date" errors={errors} />
    </div>
  );
}

