"use client";

import { FieldError, fieldA11y, useFocusFirstError } from "@/components/ui/field-error";
import { useToastAction } from "@/components/ui/toast";
import { useActionState } from "react";
import {
  saveOverallBudgetAction,
  type BudgetFormState,
} from "@/app/(app)/budgets/actions";
import { currencySymbol, type CurrencyCode } from "@/lib/currency";
import { button, input, label } from "@/lib/ui";

const initialState: BudgetFormState = { status: "idle" };

// Sets or updates the overall budget for one month.
export function BudgetForm({
  month,
  initialAmount,
  currency,
}: {
  month: string;
  currency: CurrencyCode;
  // Rupees as text, e.g. "30000.00". Undefined when no budget is set yet.
  initialAmount?: string;
}) {
  const [state, formAction, pending] = useActionState(
    useToastAction(saveOverallBudgetAction),
    initialState,
  );
  const formRef = useFocusFirstError(state);
  const errors = state.fieldErrors ?? {};
  const amountErrors = errors.amount ?? errors.month;

  return (
    <form
      ref={formRef}
      // New key when the saved budget (or month) changes, so the field shows the
      // saved value after React 19 resets the form.
      key={`${month}-${initialAmount ?? "none"}`}
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

      <div>
        <label htmlFor="amount" className={label}>
          Monthly budget ({currencySymbol(currency)})
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
          {...fieldA11y("amount", amountErrors)}
          className={`${input} tabular-nums`}
        />
        <FieldError id="amount" errors={amountErrors} />
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
