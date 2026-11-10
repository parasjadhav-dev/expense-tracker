"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";
import { button, input, label, link } from "@/lib/ui";

const initialState: LoginState = { status: "idle" };

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
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

      <div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="password" className={label}>
            Password
          </label>
          <Link href="/forgot-password" className={`${link} text-sm`}>
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${button("primary")} mt-2 h-11`}
      >
        {pending ? "Logging in..." : "Log in"}
      </button>
    </form>
  );
}
