"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
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
    saveCategoryBudgetsAction,
    initialState,
  );
  const rowErrors = state.rowErrors ?? {};

  return (
    <form
      // New key when saved values change, so fields show the saved amounts
      // after React 19 resets the form.
      key={`${month}|${rows.map((row) => row.amount ?? "").join(",")}`}
      action={formAction}
      className="flex flex-col gap-4"
      noValidate
    >
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
                className="pt-2 text-sm font-medium text-zinc-900 dark:text-zinc-100"
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
                  aria-invalid={error ? true : undefined}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-right text-sm tabular-nums text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-[#2a78d6] focus:ring-2 focus:ring-[#2a78d6]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                />
                {error ? (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        Leave a field blank for no limit on that category.
      </p>

      <button type="submit" disabled={pending} className={button("primary")}>
        {pending ? "Saving..." : "Save category budgets"}
      </button>
    </form>
  );
}
