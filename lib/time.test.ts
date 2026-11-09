import { afterEach, describe, expect, it } from "vitest";
import { daysLeftInMonth, safeToSpend } from "@/lib/budget";
import { currentMonth, resolveMonth } from "@/lib/expense-filters";
import { appTimeZone, todayInAppZone } from "@/lib/time";

// "Today" and "this month" decide the days left and the safe-to-spend figure, so
// they are checked around midnight in several zones.

const original = process.env.APP_TIME_ZONE;
afterEach(() => {
  if (original === undefined) delete process.env.APP_TIME_ZONE;
  else process.env.APP_TIME_ZONE = original;
});

function inZone<T>(zone: string | undefined, run: () => T): T {
  if (zone === undefined) delete process.env.APP_TIME_ZONE;
  else process.env.APP_TIME_ZONE = zone;
  return run();
}

describe("todayInAppZone", () => {
  it("defaults to Asia/Kolkata (UTC+5:30): the date rolls over at 18:30 UTC", () => {
    inZone(undefined, () => {
      expect(appTimeZone()).toBe("Asia/Kolkata");
      expect(todayInAppZone(new Date("2026-11-30T18:29:59Z"))).toBe("2026-11-30");
      expect(todayInAppZone(new Date("2026-11-30T18:30:00Z"))).toBe("2026-12-01");
    });
  });

  it("a UTC override rolls over at midnight UTC", () => {
    inZone("UTC", () => {
      expect(todayInAppZone(new Date("2026-11-30T23:59:59Z"))).toBe("2026-11-30");
      expect(todayInAppZone(new Date("2026-12-01T00:00:00Z"))).toBe("2026-12-01");
    });
  });

  it("America/Los_Angeles is UTC-8 in November", () => {
    inZone("America/Los_Angeles", () => {
      expect(todayInAppZone(new Date("2026-12-01T07:59:59Z"))).toBe("2026-11-30");
      expect(todayInAppZone(new Date("2026-12-01T08:00:00Z"))).toBe("2026-12-01");
    });
  });

  it("Pacific/Kiritimati is UTC+14, the furthest ahead", () => {
    inZone("Pacific/Kiritimati", () => {
      expect(todayInAppZone(new Date("2026-11-30T10:00:00Z"))).toBe("2026-12-01");
    });
  });

  it("handles the daylight-saving change (New York, 8 March 2026)", () => {
    inZone("America/New_York", () => {
      expect(todayInAppZone(new Date("2026-03-08T06:59:00Z"))).toBe("2026-03-08"); // 01:59 EST
      expect(todayInAppZone(new Date("2026-03-08T07:01:00Z"))).toBe("2026-03-08"); // 03:01 EDT
      expect(todayInAppZone(new Date("2026-03-09T03:59:00Z"))).toBe("2026-03-08"); // 23:59 EDT
      expect(todayInAppZone(new Date("2026-03-09T04:00:00Z"))).toBe("2026-03-09");
    });
  });

  it("handles a leap day", () => {
    inZone(undefined, () => {
      expect(todayInAppZone(new Date("2028-02-29T12:00:00Z"))).toBe("2028-02-29");
    });
  });

  it("a blank APP_TIME_ZONE falls back to the default", () => {
    inZone("   ", () => expect(appTimeZone()).toBe("Asia/Kolkata"));
    inZone("", () => {
      expect(todayInAppZone(new Date("2026-11-09T12:00:00Z"))).toBe("2026-11-09");
    });
  });

  it("an invalid zone fails loudly with a clear message", () => {
    inZone("Mars/Olympus", () => {
      expect(() => todayInAppZone(new Date())).toThrow(
        /APP_TIME_ZONE "Mars\/Olympus" is not a valid IANA time zone/,
      );
    });
  });
});

describe("currentMonth and resolveMonth follow the same zone", () => {
  const instant = new Date("2026-11-30T20:30:00Z"); // 02:00 on 1 December in India

  it("02:00 IST on 1 December is already December; in UTC it is still November", () => {
    inZone(undefined, () => expect(currentMonth(instant)).toBe("2026-12"));
    inZone("UTC", () => expect(currentMonth(instant)).toBe("2026-11"));
  });

  it("resolveMonth: no value means the current month, an empty value means all months", () => {
    inZone(undefined, () => {
      expect(resolveMonth(undefined, instant)).toBe("2026-12");
      expect(resolveMonth("", instant)).toBeNull();
      expect(resolveMonth("2026-05", instant)).toBe("2026-05");
      expect(resolveMonth("banana", instant)).toBe("2026-12");
    });
  });
});

describe("month rollover end to end", () => {
  it("just after midnight IST on 1 December, November is over and December is whole", () => {
    inZone(undefined, () => {
      const today = todayInAppZone(new Date("2026-11-30T20:30:00Z"));
      expect(daysLeftInMonth("2026-11", today)).toBe(0);
      expect(safeToSpend({ budget: 100000, spent: 40000, daysLeft: 0 }).kind).toBe("month-ended");
      expect(safeToSpend({ budget: 3100000, spent: 0, daysLeft: daysLeftInMonth("2026-12", today) })).toMatchObject({
        kind: "ok",
        perDay: 100000,
      });
    });
  });

  it("on the last evening in India there is still 1 day left", () => {
    inZone(undefined, () => {
      const today = todayInAppZone(new Date("2026-11-30T18:00:00Z")); // 23:30 IST
      expect(today).toBe("2026-11-30");
      expect(daysLeftInMonth("2026-11", today)).toBe(1);
    });
  });
});
