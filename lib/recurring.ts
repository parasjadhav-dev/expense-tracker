// Which expenses a recurring item (rent, a subscription) owes right now. Pure: the
// clock is passed in as `today`, and nothing here touches the database.
//
// An item runs on one day of every month. In a month that is too short for that
// day (day 31 in April, day 30 in February) it runs on the last day of the month.
// `lastGeneratedMonth` is the newest month already handled, so months are created
// once, in order, and a month the user deleted an expense from is not created
// again.

export const MAX_CATCH_UP_MONTHS = 36; // never create more than this in one go

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const monthIndex = (month: string) => {
  const match = MONTH_PATTERN.exec(month);
  if (!match) throw new RangeError(`Invalid month: ${month}`);
  return Number(match[1]) * 12 + Number(match[2]) - 1;
};

const monthFromIndex = (index: number) =>
  `${String(Math.floor(index / 12)).padStart(4, "0")}-${String((index % 12) + 1).padStart(2, "0")}`;

export function shiftRecurringMonth(month: string, by: number): string {
  return monthFromIndex(monthIndex(month) + by);
}

function daysInMonth(month: string): number {
  const [year, number] = month.split("-").map(Number);
  return new Date(Date.UTC(year, number, 0)).getUTCDate();
}

// "2026-02", 31 -> "2026-02-28"
export function dueDateFor(month: string, dayOfMonth: number): string {
  const day = Math.min(dayOfMonth, daysInMonth(month));
  return `${month}-${String(day).padStart(2, "0")}`;
}

export type DueExpense = { month: string; date: string };

export function dueExpenses(input: {
  startMonth: string;
  lastGeneratedMonth: string;
  dayOfMonth: number;
  today: string; // YYYY-MM-DD
}): DueExpense[] {
  const match = DAY_PATTERN.exec(input.today);
  if (!match) throw new RangeError(`Invalid date: ${input.today}`);
  const currentMonth = `${match[1]}-${match[2]}`;

  const current = monthIndex(currentMonth);
  const first = Math.max(
    monthIndex(input.startMonth),
    monthIndex(input.lastGeneratedMonth) + 1,
    current - (MAX_CATCH_UP_MONTHS - 1),
  );

  const due: DueExpense[] = [];
  for (let index = first; index <= current; index++) {
    const month = monthFromIndex(index);
    const date = dueDateFor(month, input.dayOfMonth);
    if (date > input.today) break; // this month's day has not come yet
    due.push({ month, date });
  }
  return due;
}

// When an item is resumed after a pause, the paused months are not made up: it
// carries on from this month.
export function lastMonthAfterResume(currentMonth: string, lastGeneratedMonth: string): string {
  const beforeCurrent = shiftRecurringMonth(currentMonth, -1);
  return monthIndex(beforeCurrent) > monthIndex(lastGeneratedMonth)
    ? beforeCurrent
    : lastGeneratedMonth;
}

// The next date an active item will create an expense, for display.
export function nextDueDate(input: {
  startMonth: string;
  lastGeneratedMonth: string;
  dayOfMonth: number;
}): string {
  const next = shiftRecurringMonth(input.lastGeneratedMonth, 1);
  const month = monthIndex(next) > monthIndex(input.startMonth) ? next : input.startMonth;
  return dueDateFor(month, input.dayOfMonth);
}
