export type RecurringFieldName =
  | "amount"
  | "categoryId"
  | "dayOfMonth"
  | "startMonth"
  | "note";

export type RecurringFormValues = Record<RecurringFieldName, string>;

export type RecurringFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<RecurringFieldName, string[]>>;
  // Echoed back so the form can refill itself after an error.
  values?: RecurringFormValues;
  savedAt?: number;
};
