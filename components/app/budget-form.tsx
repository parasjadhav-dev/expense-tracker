"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  saveOverallBudgetAction,
  type BudgetFormState,
} from "@/app/(app)/budgets/actions";
import { button, input, label } from "@/lib/ui";

const initialState: BudgetFormState = { status: "idle" };

// Sets or updates the overall budget for one month.
export function BudgetForm({
  month,
  initialAmount,
}: {
  month: string;
  // Rupees as text, e.g. "30000.00". Undefined when no budget is set yet.
  initialAmount?: string;
}) {
  const [state, formAction, pending] = useActionState(
    saveOverallBudgetAction,
    initialState,
  );
  const errors = state.fieldErrors ?? {};
  const amountErrors = errors.amount ?? errors.month;

  return (
    <form
      // New key when the saved budget (or month) changes, so the field shows the
      // saved value after React 19 resets the form.
      key={`${month}-${initialAmount ?? "none"}`}
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

      <div>
        <label htmlFor="amount" className={label}>
          Monthly budget (₹)
        </label>
        <input
          id="amount"
          name="amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          required
          defaultValue={state.values?.amount ?? initialAmount}
          aria-invalid={amountErrors ? true : undefined}
          className={`${input} text-base tabular-nums`}
        />
        {amountErrors?.length ? (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
            {amountErrors[0]}
          </p>
        ) : null}
      </div>

      <button type="submit" disabled={pending} className={button("primary")}>
        {pending
          ? "Saving..."
          : initialAmount === undefined
            ? "Set budget"
            : "Update budget"}
      </button>
    </form>
  );
}
