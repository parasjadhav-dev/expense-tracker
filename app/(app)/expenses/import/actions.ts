"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  SAVE_FAILED_MESSAGE,
  logActionError,
  revalidateExpensePages,
} from "@/lib/action-errors";
import { auth } from "@/lib/auth";
import { suggestCategoryId } from "@/lib/auto-categorize";
import { ensureDefaultCategories } from "@/lib/categories";
import { MAX_NOTE_LENGTH, parseStatement } from "@/lib/csv-import";
import { db } from "@/lib/db";
import { markDuplicates } from "@/lib/import-duplicates";
import {
  MAX_IMPORT_BYTES,
  MAX_IMPORT_LABEL,
  MAX_IMPORT_ROWS,
} from "@/lib/import-limits";
import type { ConfirmState, PreviewRow, PreviewState } from "@/lib/import-types";
import { MAX_PAISE } from "@/lib/money";
import { todayInAppZone } from "@/lib/time";
import { parseDateOnly } from "@/lib/validations/expense";

const READ_FAILED_MESSAGE =
  "Something went wrong on our side while reading the file. Please try again.";

const EARLIEST_DATE = "2000-01-01";

// Saved expenses in the date range of the incoming rows, for duplicate checks.
async function existingInRange(userId: string, dates: string[]) {
  const sorted = [...dates].sort();
  const rows = await db.expense.findMany({
    where: {
      userId,
      date: {
        gte: new Date(`${sorted[0]}T00:00:00.000Z`),
        lte: new Date(`${sorted[sorted.length - 1]}T00:00:00.000Z`),
      },
    },
    select: { date: true, amount: true, note: true },
  });
  return rows.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    amount: row.amount,
    note: row.note,
  }));
}

// Step 1: read the uploaded file and show what would be imported. Nothing is
// saved here.
export async function previewImport(
  _prev: PreviewState,
  formData: FormData,
): Promise<PreviewState> {
  // Checked here, not only in proxy.ts: server actions are POST requests that
  // proxy matchers can miss.
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/expenses/import");
  const userId = session.user.id;

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a CSV file to import." };
  }
  if (file.size > MAX_IMPORT_BYTES) {
    return {
      status: "error",
      message: `That file is larger than ${MAX_IMPORT_LABEL}. Split it into smaller files.`,
    };
  }
  if (!/\.(csv|txt)$/i.test(file.name) && !/csv|text\/plain/i.test(file.type)) {
    return { status: "error", message: "Only .csv files can be imported." };
  }

  const text = await file.text();
  const parsed = parseStatement(text, todayInAppZone());
  if (!parsed.ok) return { status: "error", message: parsed.error };
  if (parsed.rows.length === 0) {
    const notes = [
      parsed.credits > 0
        ? `${parsed.credits} credit ${parsed.credits === 1 ? "row was" : "rows were"} ignored`
        : "",
      parsed.skipped.length > 0
        ? `${parsed.skipped.length} ${parsed.skipped.length === 1 ? "row was" : "rows were"} skipped`
        : "",
    ].filter(Boolean);
    return {
      status: "error",
      message: `No expenses found in this file${notes.length ? ` (${notes.join(", ")})` : ""}.`,
    };
  }

  try {
    await ensureDefaultCategories(userId);
    const [categories, existing] = await Promise.all([
      db.category.findMany({ where: { userId }, select: { id: true, name: true } }),
      existingInRange(userId, parsed.rows.map((row) => row.date)),
    ]);
    const duplicates = markDuplicates(parsed.rows, existing);
    const rows: PreviewRow[] = parsed.rows.map((row, index) => ({
      id: index,
      line: row.line,
      date: row.date,
      amount: row.amount,
      note: row.note,
      categoryId: suggestCategoryId(row.note, categories),
      duplicate: duplicates[index],
    }));
    return {
      status: "preview",
      token: Date.now(),
      fileName: file.name.slice(0, 120),
      rows,
      skipped: parsed.skipped,
      credits: parsed.credits,
    };
  } catch (error) {
    logActionError("previewImport", error);
    return { status: "error", message: READ_FAILED_MESSAGE };
  }
}

// What the browser sends back. It is the user's own data, but it is validated
// like any other input: dates, amounts and note lengths are re-checked, and every
// category must belong to the signed-in user.
const confirmSchema = z
  .array(
    z.object({
      date: z.string(),
      amount: z.number().int().min(1).max(MAX_PAISE),
      note: z.string().max(MAX_NOTE_LENGTH),
      categoryId: z.string().min(1),
      // The user ticked a row that looked like a duplicate and wants it anyway.
      force: z.boolean().optional(),
    }),
  )
  .min(1)
  .max(MAX_IMPORT_ROWS);

// Step 2: save the rows the user chose.
export async function confirmImport(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/expenses/import");
  const userId = session.user.id;

  let json: unknown;
  try {
    json = JSON.parse(String(formData.get("rows") ?? ""));
  } catch {
    return { status: "error", message: "Select at least one expense to import." };
  }
  const parsed = confirmSchema.safeParse(json);
  if (!parsed.success) {
    return { status: "error", message: "Select at least one expense to import." };
  }

  const today = todayInAppZone();
  const rows = parsed.data;
  for (const row of rows) {
    if (!parseDateOnly(row.date) || row.date < EARLIEST_DATE || row.date > today) {
      return {
        status: "error",
        message: "One of the dates is not valid. Upload the file again.",
      };
    }
  }

  try {
    const wanted = [...new Set(rows.map((row) => row.categoryId))];
    const owned = await db.category.count({ where: { userId, id: { in: wanted } } });
    if (owned !== wanted.length) {
      return {
        status: "error",
        message: "A selected category no longer exists. Upload the file again.",
      };
    }

    // Checked again on the server: the account may have changed since the
    // preview, and a second click must not add the rows twice.
    const existing = await existingInRange(userId, rows.map((row) => row.date));
    const duplicate = markDuplicates(rows, existing);
    const keep = rows.filter((row, index) => !duplicate[index] || row.force);

    if (keep.length > 0) {
      await db.expense.createMany({
        data: keep.map((row) => ({
          userId,
          categoryId: row.categoryId,
          date: new Date(`${row.date}T00:00:00.000Z`),
          amount: row.amount,
          note: row.note === "" ? null : row.note,
        })),
      });
      revalidateExpensePages();
    }

    return {
      status: "done",
      imported: keep.length,
      duplicates: rows.length - keep.length,
      totalPaise: keep.reduce((sum, row) => sum + row.amount, 0),
      latestMonth:
        keep.length > 0 ? keep.map((row) => row.date).sort().at(-1)!.slice(0, 7) : "",
    };
  } catch (error) {
    logActionError("confirmImport", error);
    return { status: "error", message: SAVE_FAILED_MESSAGE };
  }
}
