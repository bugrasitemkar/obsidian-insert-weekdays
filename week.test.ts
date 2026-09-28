import { describe, expect, it } from "vitest";
import {
  StartDay,
  addDays,
  buildWeeks,
  daysBetween,
  findWeekForDate,
  formatRange,
  generateWeekMarkdown,
  ordinal,
  startOfWeek,
  weekNumber,
} from "./week";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const START_DAYS: StartDay[] = [1, 0];

const MONDAY: StartDay = 1;
const SUNDAY: StartDay = 0;

const YEARS = [
  2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026,
  2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035,
];

function makeDate(year: number, month: number, day: number): Date {
  return new Date(year, month, day);
}

function eachDay(year: number): Date[] {
  const days: Date[] = [];
  const cursor = makeDate(year, 0, 1);
  while (cursor.getFullYear() === year) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

// Independent ISO-8601 week reference, used to validate weekNumber().
function isoReference(date: Date): { year: number; week: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
  return { year, week };
}

interface ParsedHeading {
  name: string;
  day: number;
}

function parseHeadings(markdown: string): ParsedHeading[] {
  const headings: ParsedHeading[] = [];
  const re = /^## ([A-Za-z]+) (\d+)(?:st|nd|rd|th)$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(markdown)) !== null) {
    headings.push({ name: match[1], day: Number(match[2]) });
  }
  return headings;
}

describe("ordinal", () => {
  it("adds the correct suffix", () => {
    const cases: Record<number, string> = {
      1: "1st",
      2: "2nd",
      3: "3rd",
      4: "4th",
      9: "9th",
      10: "10th",
      11: "11th",
      12: "12th",
      13: "13th",
      20: "20th",
      21: "21st",
      22: "22nd",
      23: "23rd",
      30: "30th",
      31: "31st",
    };
    for (const [n, expected] of Object.entries(cases)) {
      expect(ordinal(Number(n))).toBe(expected);
    }
  });
});

describe("startOfWeek", () => {
  it("always returns a date on the configured start day, never after the input", () => {
    for (const startDay of START_DAYS) {
      for (const year of [2025, 2026, 2027]) {
        for (const date of eachDay(year)) {
          const ws = startOfWeek(date, startDay);
          expect(ws.getDay()).toBe(startDay);
          const delta = daysBetween(ws, date);
          expect(delta).toBeGreaterThanOrEqual(0);
          expect(delta).toBeLessThanOrEqual(6);
          expect(ws.getTime()).toBeLessThanOrEqual(
            makeDate(date.getFullYear(), date.getMonth(), date.getDate()).getTime(),
          );
        }
      }
    }
  });

  it("keeps the same date when it already is the start day", () => {
    expect(startOfWeek(makeDate(2026, 8, 28), MONDAY)).toEqual(makeDate(2026, 8, 28));
    expect(startOfWeek(makeDate(2026, 8, 27), SUNDAY)).toEqual(makeDate(2026, 8, 27));
  });
});

describe("weekNumber", () => {
  it("matches the independent ISO-8601 reference for Monday start across many years", () => {
    for (const year of YEARS) {
      for (const date of eachDay(year)) {
        expect(weekNumber(date, MONDAY)).toBe(isoReference(date).week);
      }
    }
  });

  it("never returns 0 or a number above 53", () => {
    for (const startDay of START_DAYS) {
      for (const year of YEARS) {
        for (const date of eachDay(year)) {
          const n = weekNumber(date, startDay);
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(53);
        }
      }
    }
  });

  it("handles the ISO year-boundary cases", () => {
    // 2021-01-01 is a Friday belonging to ISO week 53 of 2020.
    expect(weekNumber(makeDate(2021, 0, 1), MONDAY)).toBe(53);
    // 2026-01-01 is a Thursday belonging to ISO week 1 of 2026.
    expect(weekNumber(makeDate(2026, 0, 1), MONDAY)).toBe(1);
    // 2029-12-31 is a Monday belonging to ISO week 1 of 2030.
    expect(weekNumber(makeDate(2029, 11, 31), MONDAY)).toBe(1);
  });
});

describe("buildWeeks", () => {
  it("produces 52 or 53 sequential weeks for every year and start day", () => {
    for (const startDay of START_DAYS) {
      for (const year of YEARS) {
        const weeks = buildWeeks(year, startDay);
        expect([52, 53]).toContain(weeks.length);
        weeks.forEach((w, i) => {
          expect(w.week).toBe(i + 1);
          expect(w.start.getDay()).toBe(startDay);
        });
      }
    }
  });

  it("produces consecutive, non-overlapping weeks with a 6-day end offset", () => {
    for (const startDay of START_DAYS) {
      for (const year of [2026, 2027, 2028]) {
        const weeks = buildWeeks(year, startDay);
        for (let i = 0; i < weeks.length; i++) {
          expect(daysBetween(weeks[i].start, weeks[i].end)).toBe(6);
          if (i > 0) {
            expect(daysBetween(weeks[i - 1].start, weeks[i].start)).toBe(7);
          }
        }
      }
    }
  });

  it("starts week 1 on the week containing January 4th", () => {
    for (const startDay of START_DAYS) {
      for (const year of YEARS) {
        const weeks = buildWeeks(year, startDay);
        const jan4 = makeDate(year, 0, 4);
        expect(weeks[0].start).toEqual(startOfWeek(jan4, startDay));
        expect(daysBetween(weeks[0].start, jan4)).toBeLessThanOrEqual(6);
        expect(daysBetween(jan4, weeks[0].end)).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("maps known 2026 weeks to the expected dates", () => {
    const mondayWeeks = buildWeeks(2026, MONDAY);
    expect(mondayWeeks.find((w) => w.week === 40)?.start).toEqual(
      makeDate(2026, 8, 28),
    );

    const sundayWeeks = buildWeeks(2026, SUNDAY);
    expect(sundayWeeks.find((w) => w.week === 39)?.start).toEqual(
      makeDate(2026, 8, 27),
    );
  });
});

describe("generateWeekMarkdown", () => {
  it("emits 7 real, consecutive calendar days starting on the configured start day", () => {
    for (const startDay of START_DAYS) {
      for (const year of YEARS) {
        for (const week of buildWeeks(year, startDay)) {
          const headings = parseHeadings(generateWeekMarkdown(week, startDay));
          expect(headings).toHaveLength(7);

          for (let i = 0; i < 7; i++) {
            const expected = new Date(
              week.start.getFullYear(),
              week.start.getMonth(),
              week.start.getDate() + i,
            );
            expect(expected.getDay()).toBe((startDay + i) % 7);
            expect(headings[i].name).toBe(DAY_NAMES[expected.getDay()]);
            expect(headings[i].day).toBe(expected.getDate());
          }
        }
      }
    }
  });

  it("includes a checkbox under every day heading", () => {
    for (const startDay of START_DAYS) {
      const md = generateWeekMarkdown(buildWeeks(2026, startDay)[0], startDay);
      expect(md.match(/- \[ \]/g)).toHaveLength(7);
      expect(md.match(/^## /gm)).toHaveLength(7);
    }
  });

  it("renders the expected Monday-first template for 2026 week 40", () => {
    const week = buildWeeks(2026, MONDAY).find((w) => w.week === 40)!;
    const md = generateWeekMarkdown(week, MONDAY);
    expect(md).toBe(
      [
        "## Monday 28th",
        "",
        "- [ ] ",
        "",
        "## Tuesday 29th",
        "",
        "- [ ] ",
        "",
        "## Wednesday 30th",
        "",
        "- [ ] ",
        "",
        "## Thursday 1st",
        "",
        "- [ ] ",
        "",
        "## Friday 2nd",
        "",
        "- [ ] ",
        "",
        "## Saturday 3rd",
        "",
        "- [ ] ",
        "",
        "## Sunday 4th",
        "",
        "- [ ] ",
      ].join("\n"),
    );
  });

  it("renders the expected Sunday-first template for the same dates", () => {
    const week = buildWeeks(2026, SUNDAY).find((w) => w.week === 39)!;
    const headings = parseHeadings(generateWeekMarkdown(week, SUNDAY));
    expect(headings.map((h) => h.name)).toEqual([
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ]);
    expect(headings[0].day).toBe(27);
    expect(headings[6].day).toBe(3);
  });
});

describe("findWeekForDate", () => {
  it("selects the week whose start matches the date's week start", () => {
    for (const startDay of START_DAYS) {
      for (const year of [2025, 2026, 2027]) {
        const weeks = buildWeeks(year, startDay);
        const firstStart = weeks[0].start;
        const lastEnd = weeks[weeks.length - 1].end;
        for (const date of eachDay(year)) {
          const target = startOfWeek(date, startDay);
          if (daysBetween(firstStart, target) >= 0 && daysBetween(target, lastEnd) >= 0) {
            const selected = findWeekForDate(weeks, date, startDay);
            expect(selected.start).toEqual(target);
          }
        }
      }
    }
  });

  it("clamps out-of-range dates to the nearest week", () => {
    const weeks = buildWeeks(2026, MONDAY);
    const before = findWeekForDate(weeks, makeDate(2026, 0, 1), MONDAY);
    expect(before.start).toEqual(weeks[0].start);
    const after = findWeekForDate(weeks, makeDate(2027, 0, 10), MONDAY);
    expect(after.start).toEqual(weeks[weeks.length - 1].start);
  });
});

describe("helpers", () => {
  it("addDays preserves calendar math across month ends", () => {
    expect(addDays(makeDate(2026, 8, 28), 3)).toEqual(makeDate(2026, 9, 1));
    expect(addDays(makeDate(2026, 11, 31), 1)).toEqual(makeDate(2027, 0, 1));
  });

  it("formatRange collapses same-month ranges", () => {
    expect(formatRange(makeDate(2026, 8, 28), makeDate(2026, 9, 4))).toBe(
      "Sep 28 - Oct 4",
    );
    expect(
      formatRange(makeDate(2026, 8, 22), makeDate(2026, 8, 28)),
    ).toBe("Sep 22 - 28");
  });
});
