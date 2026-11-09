// Limits for the CSV import. Kept in a module with no imports so the browser can
// check them too without loading the CSV parser.

// A Server Action request is capped at 1 MB by default, and the upload travels
// in one, so the file must leave room for the form around it.
export const MAX_IMPORT_BYTES = 800 * 1024;
export const MAX_IMPORT_LABEL = "800 KB";
export const MAX_IMPORT_ROWS = 2000;
