// The app's calendar runs in a single time zone, because the server cannot know
// each user's. Expense dates are plain calendar dates; this decides what "today"
// and "this month" mean. Set APP_TIME_ZONE (an IANA name such as
// "America/New_York") to change it.
const DEFAULT_TIME_ZONE = "Asia/Kolkata";

export function appTimeZone(): string {
  return process.env.APP_TIME_ZONE?.trim() || DEFAULT_TIME_ZONE;
}

// "YYYY-MM-DD" for the given instant in the app time zone.
export function todayInAppZone(now: Date = new Date()): string {
  const timeZone = appTimeZone();
  try {
    // The en-CA locale formats dates as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch (error) {
    if (error instanceof RangeError) {
      throw new Error(
        `APP_TIME_ZONE "${timeZone}" is not a valid IANA time zone, for example "Asia/Kolkata".`,
      );
    }
    throw error;
  }
}
