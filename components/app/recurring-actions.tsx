"use client";

import { useState } from "react";
import { Pause, Play, Trash2 } from "lucide-react";
import { deleteRecurring, setRecurringActive } from "@/app/(app)/recurring/actions";
import { button } from "@/lib/ui";

// Pause or resume, and delete with a confirmation step.
export function RecurringActions({
  id,
  active,
  name,
}: {
  id: string;
  active: boolean;
  name: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label={`Delete ${name}`}>
        <span className="text-sm text-zinc-700 dark:text-zinc-300">Delete this item?</span>
        <form action={deleteRecurring}>
          <input type="hidden" name="id" value={id} />
          <button type="submit" className={button("danger", "sm")} data-testid="recurring-delete-confirm">
            Yes, delete
          </button>
        </form>
        <button type="button" onClick={() => setConfirming(false)} className={button("secondary", "sm")}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={setRecurringActive}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="active" value={active ? "false" : "true"} />
        <button
          type="submit"
          className={button("secondary", "sm")}
          data-testid={active ? "recurring-pause" : "recurring-resume"}
          aria-label={`${active ? "Pause" : "Resume"} ${name}`}
        >
          {active ? (
            <Pause className="size-3.5" aria-hidden="true" />
          ) : (
            <Play className="size-3.5" aria-hidden="true" />
          )}
          {active ? "Pause" : "Resume"}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={button("secondary", "sm")}
        data-testid="recurring-delete"
        aria-label={`Delete ${name}`}
      >
        <Trash2 className="size-3.5" aria-hidden="true" />
        Delete
      </button>
    </div>
  );
}
