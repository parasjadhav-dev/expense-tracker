import Papa from "papaparse";
import { MAX_IMPORT_ROWS } from "@/lib/import-limits";
import { parseRupeesToPaise } from "@/lib/money";

// Turns the text of a bank or UPI statement export into expense rows. It is pure:
// the clock ("today") is passed in, and nothing here touches the database.
//
// What it understands:
// - a header row anywhere in the first 25 lines (banks often put account details
//   above it), with common column names for date, description, amount, debit,
//   credit and type;
// - "Debit / Credit" columns, or one "Amount" column with a Dr/Cr type column,
//   a minus sign, or a Dr/Cr suffix;
// - dates like 2026-11-09, 09/11/2026 (day first), 9-Nov-2026 and Nov 9, 2026;
// - amounts like 1,234.50, ₹1,234.50, Rs. 99 and (250.00).
// Only money going out becomes an expense. Credits are counted and ignored.

export { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from "@/lib/import-limits";
export const MAX_NOTE_LENGTH = 200;
const EARLIEST_DATE = "2000-01-01";
const HEADER_SEARCH_LINES = 25;

export type ImportRow = {
  line: number; // 1-based row number in the file
  date: string; // YYYY-MM-DD
  amount: number; // integer paise
  note: string;
};

export type SkippedRow = { line: number; reason: string };

export type StatementParse =
  | { ok: true; rows: ImportRow[]; skipped: SkippedRow[]; credits: number }
  | { ok: false; error: string };

const HEADER_ALIASES = {
  date: ["date", "transactiondate", "txndate", "trandate", "valuedate", "postingdate", "bookingdate", "transdate", "datetime"],
  description: ["description", "narration", "particulars", "details", "transactiondetails", "transactiondescription", "remarks", "transactionremarks", "merchant", "payee", "memo", "paidto", "note"],
  debit: ["debit", "debitamount", "debitamt", "withdrawal", "withdrawals", "withdrawalamt", "withdrawalamount", "paidout", "dr"],
  credit: ["credit", "creditamount", "creditamt", "deposit", "deposits", "depositamt", "depositamount", "paidin", "cr"],
  amount: ["amount", "transactionamount", "txnamount", "amt", "amountinr", "amountrs"],
  type: ["type", "drcr", "crdr", "transactiontype", "txntype", "debitcredit", "creditdebit"],
} as const;

type Columns = {
  date: number;
  description: number; // -1 when the file has none
  debit: number;
  credit: number;
  amount: number;
  type: number;
};

const normalizeHeader = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, "");

function findColumns(cells: string[]): Columns | null {
  const find = (aliases: readonly string[]) =>
    cells.findIndex((cell) => aliases.includes(normalizeHeader(cell)));
  const columns: Columns = {
    date: find(HEADER_ALIASES.date),
    description: find(HEADER_ALIASES.description),
    debit: find(HEADER_ALIASES.debit),
    credit: find(HEADER_ALIASES.credit),
    amount: find(HEADER_ALIASES.amount),
    type: find(HEADER_ALIASES.type),
  };
  if (columns.date === -1) return null;
  if (columns.debit === -1 && columns.amount === -1) return null;
  return columns;
}

// ---------------------------------------------------------------- dates

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function monthFromName(name: string): number | null {
  const index = MONTHS.indexOf(name.slice(0, 3).toLowerCase());
  return index === -1 ? null : index + 1;
}

function buildDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects rollovers such as 31 February.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

const fullYear = (text: string) =>
  text.length === 2 ? 2000 + Number(text) : Number(text);

// Returns YYYY-MM-DD, or null when the text is not a date it understands.
// Numeric dates with slashes, dashes or dots are day first (09/11/2026 is 9
// November), which is how Indian statements write them; when the second number
// cannot be a month (11/25/2026) it is read month first.
export function parseFlexibleDate(raw: string): string | null {
  const text = raw.trim();
  if (!text) return null;

  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/.exec(text);
  if (match) return buildDate(Number(match[1]), Number(match[2]), Number(match[3]));

  match = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2}|\d{4})(?:[T\s].*)?$/.exec(text);
  if (match) {
    const year = fullYear(match[3]);
    const first = Number(match[1]);
    const second = Number(match[2]);
    if (second > 12 && first <= 12) return buildDate(year, first, second);
    return buildDate(year, second, first);
  }

  match = /^(\d{1,2})[\s\-/]+([A-Za-z]{3,9})\.?[\s\-/,]+(\d{2}|\d{4})(?:[T\s].*)?$/.exec(text);
  if (match) {
    const month = monthFromName(match[2]);
    return month ? buildDate(fullYear(match[3]), month, Number(match[1])) : null;
  }

  match = /^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$/.exec(text);
  if (match) {
    const month = monthFromName(match[1]);
    return month ? buildDate(Number(match[3]), month, Number(match[2])) : null;
  }

  return null;
}

// -------------------------------------------------------------- amounts

type Money =
  | { kind: "empty" }
  | { kind: "invalid" }
  | { kind: "zero" }
  | { kind: "ok"; paise: number; negative: boolean; side: "dr" | "cr" | null };

// "1,234.50", "₹ 99", "Rs. 99.00", "(250.00)", "-250", "250.00 Dr", "Cr 100".
export function parseMoney(raw: string): Money {
  let text = raw.trim();
  if (!text) return { kind: "empty" };

  let negative = false;
  let side: "dr" | "cr" | null = null;

  const bracketed = /^\((.*)\)$/.exec(text);
  if (bracketed) {
    negative = true;
    text = bracketed[1];
  }
  const trailing = /^(.+?)\s*(dr|cr)\.?$/i.exec(text);
  const leading = /^(dr|cr)\.?\s+(.+)$/i.exec(text);
  if (trailing) {
    side = trailing[2].toLowerCase() as "dr" | "cr";
    text = trailing[1];
  } else if (leading) {
    side = leading[1].toLowerCase() as "dr" | "cr";
    text = leading[2];
  }
  text = text.trim();
  if (text.startsWith("-") || text.startsWith("−")) {
    negative = true;
    text = text.slice(1);
  } else if (text.startsWith("+")) {
    text = text.slice(1);
  }
  text = text.replace(/^(₹|rs\.?|inr)\s*/i, "").replace(/\s+/g, "");

  if (text === "") return { kind: "empty" };
  const parsed = parseRupeesToPaise(text);
  if (parsed.ok) return { kind: "ok", paise: parsed.paise, negative, side };
  return parsed.reason === "zero" ? { kind: "zero" } : { kind: "invalid" };
}

function typeSide(raw: string): "dr" | "cr" | null {
  const text = raw.trim().toLowerCase();
  if (!text) return null;
  if (/^(dr|debit|d|withdrawal|paid|sent|purchase|payment|expense)\b/.test(text)) return "dr";
  if (/^(cr|credit|c|deposit|received|refund|income)\b/.test(text)) return "cr";
  return null;
}

// ---------------------------------------------------------------- parse

const clean = (value: string | undefined) =>
  (value ?? "").replace(/\s+/g, " ").trim();

export function parseStatement(input: string, today: string): StatementParse {
  const text = input.replace(/^﻿/, "");
  if (text.trim() === "") return { ok: false, error: "The file is empty." };

  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: false,
    delimitersToGuess: [",", ";", "\t", "|"],
  });
  const grid = parsed.data;

  let headerAt = -1;
  let columns: Columns | null = null;
  for (let i = 0; i < Math.min(grid.length, HEADER_SEARCH_LINES); i++) {
    columns = findColumns(grid[i] ?? []);
    if (columns) {
      headerAt = i;
      break;
    }
  }
  if (!columns || headerAt === -1) {
    return {
      ok: false,
      error:
        "We could not find the column headers. The file needs a Date column and an Amount (or Debit) column.",
    };
  }

  const body = grid
    .slice(headerAt + 1)
    .map((cells, offset) => ({ cells, line: headerAt + offset + 2 }))
    .filter(({ cells }) => cells.some((cell) => cell.trim() !== ""));

  if (body.length === 0) return { ok: false, error: "The file has no transactions." };
  if (body.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `The file has ${body.length} rows. Import up to ${MAX_IMPORT_ROWS} at a time.`,
    };
  }

  const cell = (cells: string[], index: number) => (index === -1 ? "" : (cells[index] ?? ""));
  const split = columns.debit !== -1;

  // With one Amount column and no Type column, a file that has any negative
  // amount uses minus for money out (positives are credits). A file with no
  // negatives lists every amount as a spend.
  let minusMeansOut = false;
  if (!split && columns.type === -1) {
    minusMeansOut = body.some(({ cells }) => {
      const money = parseMoney(cell(cells, columns.amount));
      return money.kind === "ok" && (money.negative || money.side !== null);
    });
  }

  const rows: ImportRow[] = [];
  const skipped: SkippedRow[] = [];
  let credits = 0;

  for (const { cells, line } of body) {
    const dateCell = cell(cells, columns.date).trim();
    let out: Money = { kind: "empty" };
    let isCredit = false;

    if (split) {
      const debit = parseMoney(cell(cells, columns.debit));
      const credit = columns.credit === -1 ? ({ kind: "empty" } as Money) : parseMoney(cell(cells, columns.credit));
      if (debit.kind === "ok") out = debit;
      else if (credit.kind === "ok") isCredit = true;
      else if (debit.kind === "invalid" || credit.kind === "invalid") out = { kind: "invalid" };
      else if (debit.kind === "zero" || credit.kind === "zero") out = { kind: "zero" };
    } else {
      const money = parseMoney(cell(cells, columns.amount));
      if (money.kind === "ok") {
        const side = typeSide(cell(cells, columns.type)) ?? money.side;
        if (side === "dr") out = money;
        else if (side === "cr") isCredit = true;
        else if (minusMeansOut) {
          if (money.negative) out = money;
          else isCredit = true;
        } else out = money;
      } else out = money;
    }

    // A row with no date and no amount is a footer or note, not a transaction.
    if (dateCell === "" && out.kind === "empty" && !isCredit) continue;

    if (isCredit) {
      credits += 1;
      continue;
    }
    if (out.kind === "empty") {
      skipped.push({ line, reason: "No amount." });
      continue;
    }
    if (out.kind === "zero") {
      skipped.push({ line, reason: "Amount is zero." });
      continue;
    }
    if (out.kind === "invalid") {
      skipped.push({ line, reason: "Amount not understood." });
      continue;
    }

    const date = parseFlexibleDate(dateCell);
    if (!date) {
      skipped.push({ line, reason: dateCell === "" ? "No date." : "Date not understood." });
      continue;
    }
    if (date < EARLIEST_DATE) {
      skipped.push({ line, reason: "Date is too far in the past." });
      continue;
    }
    if (date > today) {
      skipped.push({ line, reason: "Date is in the future." });
      continue;
    }

    rows.push({
      line,
      date,
      amount: out.paise,
      note: clean(cell(cells, columns.description)).slice(0, MAX_NOTE_LENGTH),
    });
  }

  return { ok: true, rows, skipped, credits };
}
