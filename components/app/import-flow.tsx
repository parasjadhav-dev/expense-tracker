"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CheckCircle2, FileSpreadsheet, TriangleAlert, Upload } from "lucide-react";
import {
  confirmImport,
  previewImport,
} from "@/app/(app)/expenses/import/actions";
import { formatDay } from "@/lib/format";
import {
  MAX_IMPORT_BYTES,
  MAX_IMPORT_LABEL,
  MAX_IMPORT_ROWS,
} from "@/lib/import-limits";
import type { ConfirmState, PreviewRow, PreviewState } from "@/lib/import-types";
import { formatPaise } from "@/lib/money";
import { button, card, iconChip } from "@/lib/ui";

type Category = { id: string; name: string };

const selectClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-2 text-sm text-zinc-950 outline-none transition focus:border-[#2a78d6] focus:ring-2 focus:ring-[#2a78d6]/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50";

// Upload a statement, check the rows, save. The server reads the file; nothing
// is stored until the user confirms.
export function ImportFlow({ categories }: { categories: Category[] }) {
  const [preview, previewAction, previewPending] = useActionState<PreviewState, FormData>(
    previewImport,
    { status: "idle" },
  );
  const [dismissed, setDismissed] = useState<number | null>(null);

  if (preview.status === "preview" && dismissed !== preview.token) {
    return (
      <PreviewStep
        key={preview.token}
        preview={preview}
        categories={categories}
        onReset={() => setDismissed(preview.token)}
      />
    );
  }

  return (
    <UploadStep
      action={previewAction}
      pending={previewPending}
      error={preview.status === "error" ? preview.message : null}
    />
  );
}

// ------------------------------------------------------------------ upload

function UploadStep({
  action,
  pending,
  error,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  error: string | null;
}) {
  const [fileName, setFileName] = useState("");
  const [sizeError, setSizeError] = useState<string | null>(null);

  // A file over the limit is refused here, before it is sent: the server could
  // not even read a request that large.
  const submit = (formData: FormData) => {
    const file = formData.get("file");
    if (file instanceof File && file.size > MAX_IMPORT_BYTES) {
      setSizeError(`That file is larger than ${MAX_IMPORT_LABEL}. Split it into smaller files.`);
      return;
    }
    setSizeError(null);
    action(formData);
  };

  return (
    <div className="grid items-start gap-4 md:gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <form action={submit} className={`${card} p-6`} noValidate>
        <h2 className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Upload a statement
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          A CSV export from your bank or a UPI app. You will review every row
          before anything is saved.
        </p>

        {error ?? sizeError ? (
          <p
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {sizeError ?? error}
          </p>
        ) : null}

        <label
          htmlFor="file"
          className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 px-6 py-10 text-center transition-colors hover:border-[#2a78d6] hover:bg-[#2a78d6]/[0.03] has-[:focus-visible]:border-[#2a78d6] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#2a78d6]/30 dark:border-zinc-700"
        >
          <span className={`${iconChip} size-11`}>
            {fileName ? (
              <FileSpreadsheet className="size-5" aria-hidden="true" />
            ) : (
              <Upload className="size-5" aria-hidden="true" />
            )}
          </span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {fileName || "Choose a CSV file"}
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            .csv, up to {MAX_IMPORT_LABEL} and {MAX_IMPORT_ROWS.toLocaleString("en-IN")} rows
          </span>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="sr-only"
            onChange={(event) => setFileName(event.target.files?.[0]?.name ?? "")}
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="submit" disabled={pending} className={`${button("primary")} h-11`}>
            {pending ? "Reading file..." : "Review file"}
          </button>
          <a
            href="/sample-statement.csv"
            download
            className="text-sm font-medium text-[#1c5cab] underline-offset-4 hover:underline dark:text-[#6da7ec]"
          >
            Download a sample file
          </a>
        </div>
      </form>

      <aside className={`${card} p-6`} aria-labelledby="import-help">
        <h2
          id="import-help"
          className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
        >
          How it works
        </h2>
        <ul className="mt-3 flex flex-col gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">Columns.</strong>{" "}
            We look for a date, a description and an amount (or separate debit
            and credit columns).
          </li>
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">Money in is ignored.</strong>{" "}
            Only spending becomes an expense.
          </li>
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">Dates</strong>{" "}
            like 09/11/2026 are read day first.
          </li>
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">Categories</strong>{" "}
            are suggested from the description (Swiggy is Food, Uber is
            Travel). You can change any of them.
          </li>
          <li>
            <strong className="font-medium text-zinc-900 dark:text-zinc-100">No double entries.</strong>{" "}
            Rows already in your account are marked and left out, so importing
            the same file twice is safe.
          </li>
        </ul>
      </aside>
    </div>
  );
}

// ----------------------------------------------------------------- preview

type Edit = { categoryId: string | null; include: boolean };

function PreviewStep({
  preview,
  categories,
  onReset,
}: {
  preview: Extract<PreviewState, { status: "preview" }>;
  categories: Category[];
  onReset: () => void;
}) {
  const [edits, setEdits] = useState<Record<number, Edit>>(() =>
    Object.fromEntries(
      preview.rows.map((row) => [row.id, { categoryId: row.categoryId, include: !row.duplicate }]),
    ),
  );
  const [confirm, confirmAction, confirmPending] = useActionState<ConfirmState, FormData>(
    confirmImport,
    { status: "idle" },
  );

  if (confirm.status === "done") {
    return <DoneStep result={confirm} total={preview.rows.length} onReset={onReset} />;
  }

  const selected = preview.rows.filter((row) => edits[row.id].include);
  const missing = selected.filter((row) => edits[row.id].categoryId === null).length;
  const totalPaise = selected.reduce((sum, row) => sum + row.amount, 0);
  const duplicates = preview.rows.filter((row) => row.duplicate).length;
  const canImport = selected.length > 0 && missing === 0 && !confirmPending;

  const payload = JSON.stringify(
    selected.map((row) => ({
      date: row.date,
      amount: row.amount,
      note: row.note,
      categoryId: edits[row.id].categoryId,
      ...(row.duplicate ? { force: true } : {}),
    })),
  );

  const update = (id: number, change: Partial<Edit>) =>
    setEdits((current) => ({ ...current, [id]: { ...current[id], ...change } }));
  const setAll = (include: boolean) =>
    setEdits((current) =>
      Object.fromEntries(
        preview.rows.map((row) => [row.id, { ...current[row.id], include: include && !row.duplicate }]),
      ),
    );
  const setCategoryForSelected = (categoryId: string) =>
    setEdits((current) =>
      Object.fromEntries(
        preview.rows.map((row) => [
          row.id,
          current[row.id].include ? { ...current[row.id], categoryId } : current[row.id],
        ]),
      ),
    );

  return (
    <form action={confirmAction} className="flex flex-col gap-4 md:gap-5">
      <input type="hidden" name="rows" value={payload} />

      <section className={`${card} p-5`} aria-labelledby="import-summary">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2
              id="import-summary"
              className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              Review {preview.rows.length} {preview.rows.length === 1 ? "expense" : "expenses"}
            </h2>
            <p className="mt-0.5 truncate text-sm text-zinc-600 dark:text-zinc-400">
              From {preview.fileName}
            </p>
          </div>
          <button type="button" onClick={onReset} className={button("secondary", "sm")}>
            Choose another file
          </button>
        </div>

        <ul className="mt-3 flex flex-wrap gap-2 text-xs" data-testid="import-facts">
          {duplicates > 0 ? (
            <li className="rounded-full bg-amber-50 px-2.5 py-1 font-medium text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900">
              {duplicates} already in your account
            </li>
          ) : null}
          {preview.credits > 0 ? (
            <li className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {preview.credits} money-in {preview.credits === 1 ? "row" : "rows"} ignored
            </li>
          ) : null}
          {preview.skipped.length > 0 ? (
            <li className="rounded-full bg-zinc-100 px-2.5 py-1 font-medium text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {preview.skipped.length} {preview.skipped.length === 1 ? "row" : "rows"} skipped
            </li>
          ) : null}
        </ul>

        {preview.skipped.length > 0 ? (
          <details className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            <summary className="cursor-pointer font-medium text-zinc-800 dark:text-zinc-200">
              Why were rows skipped?
            </summary>
            <ul className="mt-2 flex flex-col gap-1" data-testid="skipped-rows">
              {preview.skipped.slice(0, 50).map((row) => (
                <li key={row.line}>
                  Row {row.line}: {row.reason}
                </li>
              ))}
              {preview.skipped.length > 50 ? (
                <li>and {preview.skipped.length - 50} more.</li>
              ) : null}
            </ul>
          </details>
        ) : null}
      </section>

      <section className={`${card} overflow-hidden`} aria-label="Expenses to import">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-900">
          <button type="button" onClick={() => setAll(true)} className="text-sm font-medium text-[#1c5cab] hover:underline dark:text-[#6da7ec]">
            Select all
          </button>
          <button type="button" onClick={() => setAll(false)} className="text-sm font-medium text-[#1c5cab] hover:underline dark:text-[#6da7ec]">
            Select none
          </button>
          <div className="ml-auto w-full sm:w-64">
            <label htmlFor="bulk-category" className="sr-only">
              Set the category of every selected row
            </label>
            <select
              id="bulk-category"
              value=""
              onChange={(event) => event.target.value && setCategoryForSelected(event.target.value)}
              className={selectClass}
            >
              <option value="">Set category for selected rows...</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <ul className="divide-y divide-zinc-100 dark:divide-zinc-900" data-testid="import-rows">
          {preview.rows.map((row) => (
            <ImportRowItem
              key={row.id}
              row={row}
              edit={edits[row.id]}
              categories={categories}
              onChange={(change) => update(row.id, change)}
            />
          ))}
        </ul>
      </section>

      <div
        className={`${card} sticky bottom-3 z-10 flex flex-wrap items-center justify-between gap-3 p-4`}
      >
        <div className="min-w-0 text-sm" aria-live="polite">
          <p className="font-medium text-zinc-950 dark:text-zinc-50" data-testid="import-summary-line">
            {selected.length} of {preview.rows.length} selected ·{" "}
            <span className="tabular-nums">{formatPaise(totalPaise)}</span>
          </p>
          {missing > 0 ? (
            <p className="text-red-700 dark:text-red-300" data-testid="import-missing">
              Choose a category for {missing} {missing === 1 ? "row" : "rows"}, or untick{" "}
              {missing === 1 ? "it" : "them"}.
            </p>
          ) : null}
          {confirm.status === "error" ? (
            <p role="alert" className="text-red-700 dark:text-red-300">
              {confirm.message}
            </p>
          ) : null}
        </div>
        <button
          type="submit"
          disabled={!canImport}
          className={`${button("primary")} h-11`}
          data-testid="import-confirm"
        >
          {confirmPending
            ? "Importing..."
            : `Import ${selected.length} ${selected.length === 1 ? "expense" : "expenses"}`}
        </button>
      </div>
    </form>
  );
}

function ImportRowItem({
  row,
  edit,
  categories,
  onChange,
}: {
  row: PreviewRow;
  edit: Edit;
  categories: Category[];
  onChange: (change: Partial<Edit>) => void;
}) {
  const description = row.note || "(no description)";
  return (
    <li
      data-testid="import-row"
      data-included={edit.include}
      data-duplicate={row.duplicate}
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:flex-nowrap ${
        edit.include ? "" : "opacity-60"
      }`}
    >
      <input
        type="checkbox"
        checked={edit.include}
        onChange={(event) => onChange({ include: event.target.checked })}
        aria-label={`Import ${description}`}
        className="size-4 shrink-0 accent-[#2a78d6]"
      />
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50" title={description}>
          {description}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{formatDay(new Date(`${row.date}T00:00:00.000Z`))}</span>
          {row.duplicate ? (
            <span
              className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:ring-amber-900"
              title="An expense with the same date, amount and description is already saved. Tick the box to add it again anyway."
            >
              Already added
            </span>
          ) : null}
        </p>
      </div>
      <p className="shrink-0 text-right text-sm font-semibold tabular-nums text-zinc-950 md:order-3 md:w-28 dark:text-zinc-50">
        {formatPaise(row.amount)}
      </p>
      <div className="basis-full md:order-4 md:w-48 md:basis-auto">
        <label htmlFor={`category-${row.id}`} className="sr-only">
          Category for {description}
        </label>
        <select
          id={`category-${row.id}`}
          value={edit.categoryId ?? ""}
          onChange={(event) => onChange({ categoryId: event.target.value || null })}
          aria-invalid={edit.include && edit.categoryId === null ? true : undefined}
          className={`${selectClass} ${
            edit.include && edit.categoryId === null
              ? "border-red-400 ring-2 ring-red-200 dark:border-red-500 dark:ring-red-900"
              : ""
          }`}
        >
          {edit.categoryId === null ? <option value="">Choose category...</option> : null}
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
    </li>
  );
}

// -------------------------------------------------------------------- done

function DoneStep({
  result,
  total,
  onReset,
}: {
  result: Extract<ConfirmState, { status: "done" }>;
  total: number;
  onReset: () => void;
}) {
  const nothingNew = result.imported === 0;
  return (
    <div
      role="status"
      data-testid="import-done"
      className={`${card} mx-auto w-full max-w-xl p-8 text-center`}
    >
      <span className={`${iconChip} mx-auto size-12`}>
        <CheckCircle2 className="size-6" aria-hidden="true" />
      </span>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {nothingNew
          ? "Nothing new to import"
          : `Imported ${result.imported} ${result.imported === 1 ? "expense" : "expenses"}`}
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        {nothingNew
          ? `All ${total} ${total === 1 ? "row was" : "rows were"} already in your account, so nothing was added.`
          : `${formatPaise(result.totalPaise)} added.${
              result.duplicates > 0
                ? ` ${result.duplicates} ${result.duplicates === 1 ? "row was" : "rows were"} left out because ${result.duplicates === 1 ? "it was" : "they were"} already saved.`
                : ""
            }`}
      </p>
      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
        {result.latestMonth ? (
          <Link href={`/expenses?month=${result.latestMonth}`} className={button("primary")}>
            View expenses
          </Link>
        ) : (
          <Link href="/expenses" className={button("primary")}>
            View expenses
          </Link>
        )}
        <button type="button" onClick={onReset} className={button("secondary")}>
          Import another file
        </button>
      </div>
    </div>
  );
}
