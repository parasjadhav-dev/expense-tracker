"use client";

import { useEffect, useRef } from "react";

// The pieces that make a form's validation errors usable without seeing them:
//
//   <input id="amount" {...fieldA11y("amount", errors.amount)} />
//   <FieldError id="amount" errors={errors.amount} />
//
// fieldA11y marks the field invalid and points it at its message with
// aria-describedby, so a screen reader reads the message when the field gets
// focus. useFocusFirstError moves focus to the first invalid field after a
// submit that failed, so a keyboard user lands where the problem is.

export function errorId(fieldId: string): string {
  return `${fieldId}-error`;
}

// `hintId` is an existing description of the field (a hint under it); it stays
// in the description, before the error.
export function fieldA11y(
  fieldId: string,
  errors?: string | readonly string[] | null,
  hintId?: string,
): { "aria-invalid"?: true; "aria-describedby"?: string } {
  const invalid = Array.isArray(errors) ? errors.length > 0 : Boolean(errors);
  const ids = [hintId, invalid ? errorId(fieldId) : undefined].filter(Boolean);
  return {
    "aria-invalid": invalid ? true : undefined,
    "aria-describedby": ids.length > 0 ? ids.join(" ") : undefined,
  };
}

export function FieldError({
  id,
  errors,
}: {
  id: string;
  errors?: string | readonly string[] | null;
}) {
  const message = Array.isArray(errors) ? errors[0] : errors;
  if (!message) return null;
  return (
    <p id={errorId(id)} className="mt-1 text-sm text-red-700 dark:text-red-400">
      {message as string}
    </p>
  );
}

// Put the returned ref on the <form>. When `state` becomes an error, the first
// field marked aria-invalid takes focus. A form-level error with no field to
// blame leaves focus alone: its role="alert" message is announced instead.
export function useFocusFirstError(state: { status: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.status !== "error") return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  return formRef;
}
