"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { button, input, label } from "@/lib/ui";
import {
  changePassword,
  type ChangePasswordState,
} from "@/app/(app)/settings/actions";

const initialState: ChangePasswordState = { status: "idle" };

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === "success" ? (
        <p
          role="status"
          data-testid="password-success"
          className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900"
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
      ) : null}
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
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
        <FieldError errors={state.fieldErrors?.currentPassword} />
      </div>

      <div>
        <label htmlFor="newPassword" className={label}>
          New password{" "}
          <span className="font-normal text-zinc-500">(at least 8 characters)</span>
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          className={input}
        />
        <FieldError errors={state.fieldErrors?.newPassword} />
      </div>

      <div>
        <label htmlFor="confirmPassword" className={label}>
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          className={input}
        />
        <FieldError errors={state.fieldErrors?.confirmPassword} />
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

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors[0]}</p>;
}
