"use client";

import { fieldA11y, useFocusFirstError } from "@/components/ui/field-error";
import { useToastAction } from "@/components/ui/toast";
import { useActionState } from "react";
import { updateCurrency, type CurrencyState } from "@/app/(app)/settings/currency-actions";
import {
  CURRENCY_CODES,
  CURRENCY_INFO,
  currencySymbol,
  type CurrencyCode,
} from "@/lib/currency";
import { formatPaise } from "@/lib/money";
import { button, input, label } from "@/lib/ui";

const initialState: CurrencyState = { status: "idle" };

export function CurrencyForm({ currency }: { currency: CurrencyCode }) {
  const [state, formAction, pending] = useActionState(useToastAction(updateCurrency), initialState);
  const formRef = useFocusFirstError(state);
  const problem = state.status === "error" && state.message ? state.message : undefined;

  return (
    // New key when the saved currency changes, so the select shows it after
    // React resets the form.
    <form ref={formRef} key={currency} action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === "error" && state.message ? (
        <p
          id="currency-error"
          role="alert"
          data-testid="currency-error"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="currency" className={`${label} sr-only`}>
          Currency
        </label>
        <select
          id="currency"
          {...fieldA11y("currency", problem, "currency-hint")}
          name="currency"
          defaultValue={currency}
          className={`${input} h-10`}
        >
          {CURRENCY_CODES.map((code) => (
            <option key={code} value={code}>
              {code} · {CURRENCY_INFO[code].name} ({currencySymbol(code)})
            </option>
          ))}
        </select>
        <p id="currency-hint" className="mt-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          Now showing amounts like {formatPaise(123456, currency)}. Changing this
          only changes the symbol and number format. Amounts you have already
          entered are not converted.
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${button("primary")} mt-1 h-11`}
      >
        {pending ? "Saving..." : "Save currency"}
      </button>
    </form>
  );
}
