/**
 * Official Lithuanian public holidays (Darbo kodeksas 116 str.). All are
 * pure functions of the calendar year — nothing here is stored in the
 * database, so no seeding/migration is needed to keep future years correct.
 *
 * To add a holiday: add one entry to FIXED_HOLIDAYS (fixed month/day) or one
 * function to MOVABLE_HOLIDAYS (year -> date). Nothing else needs to change.
 */

export interface HolidayDefinition {
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  name: string;
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function utcDate(year: number, month1To12: number, day: number): Date {
  return new Date(Date.UTC(year, month1To12 - 1, day));
}

/** Fixed calendar-date holidays — same month/day every year. */
const FIXED_HOLIDAYS: readonly { month: number; day: number; name: string }[] = [
  { month: 1, day: 1, name: "Naujieji metai (New Year's Day)" },
  { month: 2, day: 16, name: "Lietuvos valstybės atkūrimo diena" },
  { month: 3, day: 11, name: "Lietuvos nepriklausomybės atkūrimo diena" },
  { month: 5, day: 1, name: "Tarptautinė darbo diena" },
  { month: 6, day: 24, name: "Joninės, Rasos" },
  { month: 7, day: 6, name: "Valstybės diena (Karaliaus Mindaugo karūnavimo diena)" },
  { month: 8, day: 15, name: "Žolinė (Švč. Mergelės Marijos ėmimo į dangų diena)" },
  { month: 11, day: 1, name: "Visų šventųjų diena" },
  { month: 11, day: 2, name: "Vėlinės (Mirusiųjų atminimo diena)" },
  { month: 12, day: 24, name: "Šv. Kūčios" },
  { month: 12, day: 25, name: "Šv. Kalėdų pirma diena" },
  { month: 12, day: 26, name: "Šv. Kalėdų antra diena" },
];

/** Anonymous Gregorian (Meeus/Jones/Butcher) algorithm — returns Easter Sunday for a given year. */
function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return utcDate(year, month, day);
}

/** First Sunday of the given month. */
function firstSundayOf(year: number, month1To12: number): Date {
  const first = utcDate(year, month1To12, 1);
  const offset = (7 - first.getUTCDay()) % 7;
  return utcDate(year, month1To12, 1 + offset);
}

/** Movable holidays — a date computed from the year rather than a fixed month/day. */
const MOVABLE_HOLIDAYS: readonly { name: string; dateForYear: (year: number) => Date }[] = [
  { name: "Velykos (Easter Sunday)", dateForYear: computeEasterSunday },
  {
    name: "Velykų antroji diena (Easter Monday)",
    dateForYear: (year) => {
      const easter = computeEasterSunday(year);
      return new Date(easter.getTime() + 24 * 60 * 60 * 1000);
    },
  },
  { name: "Motinos diena (Mother's Day)", dateForYear: (year) => firstSundayOf(year, 5) },
  { name: "Tėvo diena (Father's Day)", dateForYear: (year) => firstSundayOf(year, 6) },
];

/** All official Lithuanian public holidays for a given calendar year, sorted by date. */
export function getDefaultLithuanianHolidays(year: number): HolidayDefinition[] {
  const fixed = FIXED_HOLIDAYS.map((h) => ({ date: toDateKey(utcDate(year, h.month, h.day)), name: h.name }));
  const movable = MOVABLE_HOLIDAYS.map((h) => ({ date: toDateKey(h.dateForYear(year)), name: h.name }));
  return [...fixed, ...movable].sort((a, b) => a.date.localeCompare(b.date));
}
