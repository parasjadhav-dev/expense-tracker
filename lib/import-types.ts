import type { SkippedRow } from "@/lib/csv-import";

// What the preview step sends to the browser and what the confirm step sends back.

export type PreviewRow = {
  id: number; // position in the file's expense rows
  line: number;
  date: string; // YYYY-MM-DD
  amount: number; // paise
  note: string;
  categoryId: string | null; // the suggestion; null when nothing fits
  duplicate: boolean; // already in the account
};

export type PreviewState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "preview";
      token: number; // changes per upload so the table resets
      fileName: string;
      rows: PreviewRow[];
      skipped: SkippedRow[];
      credits: number;
    };

export type ConfirmState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "done";
      imported: number;
      duplicates: number; // rows left out because they were already saved
      totalPaise: number;
      latestMonth: string; // YYYY-MM of the newest imported expense
    };
