/**
 * Australia/Brisbane has no daylight saving (Queensland does not observe it),
 * so it is a fixed UTC+10:00 offset year-round. That lets fixture/demo-data
 * construction use simple arithmetic instead of a timezone library; display
 * formatting still goes through Intl with an explicit timeZone so it stays
 * correct regardless.
 */

export const BRISBANE_TZ = "Australia/Brisbane";
const BRISBANE_OFFSET_HOURS = 10;

/** Build an ISO UTC string for a Brisbane wall-clock date/time. */
export function brisbane(
  year: number,
  monthIndex0: number,
  day: number,
  hour = 0,
  minute = 0,
): string {
  const utcMs = Date.UTC(year, monthIndex0, day, hour - BRISBANE_OFFSET_HOURS, minute);
  return new Date(utcMs).toISOString();
}

/** Today's date fields as seen on a Brisbane wall clock, from the real current time. */
export function todayBrisbane(): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { year: Number(map.year), month: Number(map.month) - 1, day: Number(map.day) };
}

/** Brisbane-local date/time shifted by whole days from today, at a given hour:minute. */
export function brisbaneDayOffset(dayOffset: number, hour = 0, minute = 0): string {
  const t = todayBrisbane();
  const base = Date.UTC(t.year, t.month, t.day);
  const shifted = new Date(base + dayOffset * 86_400_000);
  return brisbane(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(), hour, minute);
}

export function formatDateShort(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE_TZ,
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(iso));
}

export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export function formatTimeRange(startIso: string, endIso: string): string {
  return `${formatTime(startIso)}–${formatTime(endIso)}`;
}

export function isSameBrisbaneDay(aIso: string, bIso: string): boolean {
  const fmt = (d: string) =>
    new Intl.DateTimeFormat("en-AU", { timeZone: BRISBANE_TZ, dateStyle: "short" }).format(
      new Date(d),
    );
  return fmt(aIso) === fmt(bIso);
}

export function dayStartBrisbaneOffset(dayOffset: number): string {
  return brisbaneDayOffset(dayOffset, 0, 0);
}

export function minutesBetween(aIso: string, bIso: string): number {
  return Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / 60_000);
}

export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

/** 0 = Sunday ... 6 = Saturday, as seen on a Brisbane wall clock today. */
export function brisbaneWeekday(): number {
  const t = todayBrisbane();
  return new Date(Date.UTC(t.year, t.month, t.day)).getUTCDay();
}

/** 0 = Sunday ... 6 = Saturday, for a given day offset from today. */
export function weekdayForOffset(dayOffset: number): number {
  return (brisbaneWeekday() + ((dayOffset % 7) + 7)) % 7;
}

/** Day offset (>= minOffset) from today to the next occurrence of targetDow. */
export function nextDayOffsetForWeekday(targetDow: number, minOffset = 0): number {
  const current = brisbaneWeekday();
  let diff = (targetDow - current + 7) % 7;
  if (diff < minOffset) diff += 7;
  return diff;
}

/** ISO instant for 00:00 Brisbane on the Monday of (this week + weekOffset weeks). */
export function brisbaneWeekStart(weekOffset = 0): string {
  const dow = brisbaneWeekday(); // 0=Sun..6=Sat
  const daysSinceMonday = (dow + 6) % 7;
  return dayStartBrisbaneOffset(-daysSinceMonday + weekOffset * 7);
}

export function relativeDayLabel(iso: string): string {
  const t = todayBrisbane();
  const todayIso = brisbane(t.year, t.month, t.day, 0, 0);
  const target = new Intl.DateTimeFormat("en-AU", { timeZone: BRISBANE_TZ, dateStyle: "short" });
  const diffDays = Math.round(
    (new Date(target.format(new Date(iso))).getTime() -
      new Date(target.format(new Date(todayIso))).getTime()) /
      86_400_000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  return formatDateShort(iso);
}
