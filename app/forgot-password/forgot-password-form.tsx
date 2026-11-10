"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import { button, input, label } from "@/lib/ui";
import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { status: "idle" };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, initialState);

  if (state.status === "success") {
    return (
      <div className="flex flex-col items-start gap-4">
        <p
          role="status"
          data-testid="forgot-success"
          className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800 ring-1 ring-green-200 dark:bg-green-950 dark:text-green-300 dark:ring-green-900"
        >
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {state.message}
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Nothing in your inbox? Check spam, or try again in a few minutes.
        </p>
        <Link href="/login" className={`${button("secondary")} h-11 w-full`}>
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {state.status === "error" && state.message ? (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
        >
          {state.message}
        </p>
      ) : null}

      <div>
        <label htmlFor="email" className={label}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          defaultValue={state.values?.email}
          className={input}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${button("primary")} mt-2 h-11`}
      >
        {pending ? "Sending..." : "Send reset link"}
      </button>
    </form>
  );
}
