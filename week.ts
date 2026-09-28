export type StartDay = 0 | 1;

export interface WeekInfo {
  week: number;
  start: Date;
  end: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_NAMES_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function dayName(day: number): string {
  return DAY_NAMES_FULL[day];
}

export function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) {
    return `${n}th`;
  }
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  const d = atMidnight(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfWeek(date: Date, startDay: StartDay): Date {
  const d = atMidnight(date);
  const diff = (d.getDay() - startDay + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function daysBetween(a: Date, b: Date): number {
  return Math.round((atMidnight(b).getTime() - atMidnight(a).getTime()) / MS_PER_DAY);
}

function formatShort(date: Date): string {
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
}

export function formatRange(start: Date, end: Date): string {
  const sameMonth =
    start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    return `${MONTHS_SHORT[start.getMonth()]} ${start.getDate()} - ${end.getDate()}`;
  }
  return `${formatShort(start)} - ${formatShort(end)}`;
}

function weekOneStart(year: number, startDay: StartDay): Date {
  return startOfWeek(new Date(year, 0, 4), startDay);
}

export function weekNumber(date: Date, startDay: StartDay): number {
  const target = startOfWeek(date, startDay);
  let year = date.getFullYear();
  if (daysBetween(weekOneStart(year, startDay), target) < 0) {
    year -= 1;
  } else if (daysBetween(weekOneStart(year + 1, startDay), target) >= 0) {
    year += 1;
  }
  return Math.floor(daysBetween(weekOneStart(year, startDay), target) / 7) + 1;
}

export function buildWeeks(year: number, startDay: StartDay): WeekInfo[] {
  const first = weekOneStart(year, startDay);
  const nextFirst = weekOneStart(year + 1, startDay);
  const total = Math.round(daysBetween(first, nextFirst) / 7);
  const weeks: WeekInfo[] = [];
  for (let i = 0; i < total; i++) {
    const start = addDays(first, i * 7);
    weeks.push({ week: i + 1, start, end: addDays(start, 6) });
  }
  return weeks;
}

export function findWeekForDate(
  weeks: WeekInfo[],
  date: Date,
  startDay: StartDay,
): WeekInfo {
  const target = startOfWeek(date, startDay);
  const exact = weeks.find((w) => daysBetween(w.start, target) === 0);
  if (exact) {
    return exact;
  }
  const last = weeks[weeks.length - 1];
  if (daysBetween(last.start, target) > 0) {
    return last;
  }
  return weeks[0];
}

export function generateWeekMarkdown(week: WeekInfo, startDay: StartDay): string {
  const lines: string[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(week.start, i);
    const heading = `## ${dayName(date.getDay())} ${ordinal(date.getDate())}`;
    lines.push(heading, "", "- [ ] ");
    if (i < 6) {
      lines.push("");
    }
  }
  return lines.join("\n");
}
