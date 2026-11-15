"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  deleteExpense,
  type DeleteExpenseState,
} from "@/app/(app)/expenses/actions";
import { Trash2 } from "lucide-react";
import { button } from "@/lib/ui";

const initialState: DeleteExpenseState = { status: "idle" };

// A Delete link that opens a confirmation dialog. Uses the native <dialog>
// element, which gives a focus trap, Escape to close and a backdrop.
export function DeleteExpenseButton({
  id,
  summary,
  variant = "link",
}: {
  id: string;
  summary: string;
  // "link" is the compact text button for the desktop table; "button" is the
  // bordered, full-size one used in the phone list.
  variant?: "link" | "button";
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(
    deleteExpense,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") dialogRef.current?.close();
  }, [state]);

  const titleId = `delete-title-${id}`;

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={
          variant === "button"
            ? `${button("dangerOutline")} flex-1`
            : "inline-flex min-h-11 items-center rounded-md px-3 text-sm font-medium text-red-600 lg:min-h-0 lg:px-2 lg:py-1 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950"
        }
      >
        {variant === "button" ? <Trash2 className="size-4" aria-hidden="true" /> : null}
        Delete
      </button>

      {/* m-auto: Tailwind's reset removes the margin that centers a modal dialog. */}
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        onClick={(event) => {
          // Only the backdrop has the dialog itself as its target.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto w-[min(92vw,24rem)] rounded-2xl bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-zinc-950/50 backdrop:backdrop-blur-[2px] dark:bg-zinc-900 dark:text-zinc-50"
      >
        <form action={formAction} className="p-6 text-left">
          <input type="hidden" name="id" value={id} />
          <h2 id={titleId} className="text-lg font-semibold tracking-tight">
            Delete this expense?
          </h2>
          <p
            data-testid="delete-summary"
            className="mt-2 rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          >
            {summary}
          </p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            This can&apos;t be undone.
          </p>
          {state.status === "error" && state.message ? (
            <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
              {state.message}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              autoFocus
              onClick={() => dialogRef.current?.close()}
              className={`${button("secondary")} flex-1 sm:flex-none`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className={`${button("danger")} flex-1 sm:flex-none`}
            >
              {pending ? "Deleting..." : "Delete"}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
