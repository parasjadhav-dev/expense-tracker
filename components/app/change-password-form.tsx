"use client";

import { FieldError, fieldA11y, useFocusFirstError } from "@/components/ui/field-error";
import { useToastAction } from "@/components/ui/toast";
import { useActionState } from "react";
import { button, input, label } from "@/lib/ui";
import {
  changePassword,
  type ChangePasswordState,
} from "@/app/(app)/settings/actions";

const initialState: ChangePasswordState = { status: "idle" };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(useToastAction(changePassword), initialState);
  const formRef = useFocusFirstError(state);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          data-testid="password-error"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="currentPassword" className={label}>
          Current password
        </label>
        <input
          id="currentPassword" {...fieldA11y("currentPassword", state.fieldErrors?.currentPassword)}
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
        <FieldError id="currentPassword" errors={state.fieldErrors?.currentPassword} />
      </div>

      <div>
        <label htmlFor="newPassword" className={label}>
          New password{" "}
          <span className="font-normal text-zinc-600 dark:text-zinc-400">(at least 8 characters)</span>
        </label>
        <input
          id="newPassword" {...fieldA11y("newPassword", state.fieldErrors?.newPassword)}
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className={input}
        />
        <FieldError id="newPassword" errors={state.fieldErrors?.newPassword} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={label}>
          Confirm new password
        </label>
        <input
          id="confirmPassword" {...fieldA11y("confirmPassword", state.fieldErrors?.confirmPassword)}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={input}
        />
        <FieldError id="confirmPassword" errors={state.fieldErrors?.confirmPassword} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${button("primary")} mt-1 h-11`}
      >
        {pending ? "Saving..." : "Change password"}
      </button>
    </form>
  );
}

