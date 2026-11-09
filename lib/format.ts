// Expense dates are stored as UTC-midnight calendar dates, so they are shown in UTC.
const dayFormat = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const shortDayFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

// 09 Nov 2026
export function formatDay(date: Date): string {
  return dayFormat.format(date);
}

// 9 Nov
export function formatShortDay(date: Date): string {
  return shortDayFormat.format(date);
}
