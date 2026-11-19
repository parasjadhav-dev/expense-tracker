"use client";

import { FieldError, fieldA11y, useFocusFirstError } from "@/components/ui/field-error";
import { useToastAction } from "@/components/ui/toast";
import { useActionState } from "react";
import {
  saveCategoryBudgetsAction,
  type CategoryBudgetsState,
} from "@/app/(app)/budgets/actions";
import { button } from "@/lib/ui";

const initialState: CategoryBudgetsState = { status: "idle" };

type Row = {
  id: string;
  name: string;
  // Rupees as text, e.g. "5000.00". Undefined when the category has no limit.
  amount?: string;
};

// One limit per category for one month. A blank field means "no limit".
export function CategoryBudgetsForm({
  month,
  rows,
}: {
  month: string;
  rows: Row[];
}) {
  const [state, formAction, pending] = useActionState(
    useToastAction(saveCategoryBudgetsAction),
    initialState,
  );
  const formRef = useFocusFirstError(state);
  const rowErrors = state.rowErrors ?? {};

  return (
    <form
      ref={formRef}
      // New key when saved values change, so fields show the saved amounts
      // after React 19 resets the form.
      key={`${month}|${rows.map((row) => row.amount ?? "").join(",")}`}
      action={formAction}
      className="flex flex-col gap-4"
      noValidate
    >
      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.message}
        </p>
      ) : null}

      <input type="hidden" name="month" value={month} />

      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const error = rowErrors[row.id];
          const inputId = `category-amount-${row.id}`;
          return (
            <li
              key={row.id}
              className="grid grid-cols-[1fr_9.5rem] items-start gap-x-3 sm:grid-cols-[1fr_11rem]"
            >
              <label
                htmlFor={inputId}
                className="pt-3 text-sm font-medium text-zinc-900 lg:pt-2 dark:text-zinc-100"
              >
                {row.name}
              </label>
              <div>
                <input
                  id={inputId}
                  name={`amount:${row.id}`}
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="No limit"
                  defaultValue={state.values?.[row.id] ?? row.amount}
                  {...fieldA11y(inputId, error)}
                  className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-right text-base tabular-nums lg:min-h-0 lg:text-sm text-zinc-950 outline-none transition placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                <FieldError id={inputId} errors={error} />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-zinc-600 dark:text-zinc-400">
        Leave a field blank for no limit on that category.
      </p>

      <button type="submit" disabled={pending} className={button("primary")}>
        {pending ? "Saving..." : "Save category budgets"}
      </button>
    </form>
  );
}
