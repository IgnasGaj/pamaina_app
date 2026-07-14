import { EmploymentType } from "@prisma/client";
import { HolidayDefinition } from "@/modules/working-time/lithuanian-holidays";

/**
 * The Lithuanian Working Time Engine — pure, side-effect-free calculation
 * logic. Nothing here touches the database or HTTP layer (see
 * working-time.service.ts for the orchestration that feeds this real
 * holiday data). Keeping it pure is what makes it independently testable
 * and reusable from anywhere (Scheduler, reports, future payroll, ...)
 * without duplicating the formula.
 */

/** Multiplier applied to the standard monthly norm for each employment type. */
export const EMPLOYMENT_FRACTIONS: Record<EmploymentType, number> = {
  FULL_TIME: 1,
  PART_TIME_75: 0.75,
  PART_TIME_50: 0.5,
  PART_TIME_25: 0.25,
};

export interface WorkingTimeRuleContext {
  year: number;
  month: number;
  /** Every date ("YYYY-MM-DD") in the month that is a non-working day (public holiday or company-specific). */
  nonWorkingDates: ReadonlySet<string>;
}

/**
 * A single adjustment applied to the standard monthly hour norm, expressed
 * as an hours delta (negative = reduction). Extension point: add a new rule
 * here and push it into STANDARD_MONTH_RULES — the calculation function
 * itself never needs to change.
 */
export interface WorkingTimeRule {
  key: string;
  description: string;
  computeHourDelta(context: WorkingTimeRuleContext): number;
}

function toDateKey(year: number, month1To12: number, day: number): string {
  return `${year}-${String(month1To12).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate();
}

/** Monday=1 ... Sunday=7. Saturday/Sunday are never standard working days under a 5-day week. */
function isoWeekday(year: number, month1To12: number, day: number): number {
  const jsDay = new Date(Date.UTC(year, month1To12 - 1, day)).getUTCDay();
  return jsDay === 0 ? 7 : jsDay;
}

function isStandardWorkingDay(year: number, month: number, day: number, nonWorkingDates: ReadonlySet<string>): boolean {
  return isoWeekday(year, month, day) <= 5 && !nonWorkingDates.has(toDateKey(year, month, day));
}

/**
 * LT Labour Code Art. 112(3): the standard working day immediately before a
 * non-working public holiday is shortened by 1 hour. Only counted when both
 * the holiday and its preceding day fall in the same calendar month — if a
 * holiday is the 1st of the month, the shortened day belongs to the
 * *previous* month's norm, not this one.
 */
const preHolidayShortenedDayRule: WorkingTimeRule = {
  key: "pre_holiday_shortened_day",
  description: "The standard working day immediately before a public holiday is shortened by 1 hour.",
  computeHourDelta(context) {
    const { year, month, nonWorkingDates } = context;
    const total = daysInMonth(year, month);
    let reductionHours = 0;

    for (let day = 2; day <= total; day += 1) {
      const isHoliday = nonWorkingDates.has(toDateKey(year, month, day));
      if (!isHoliday) continue;
      const previousDay = day - 1;
      if (isStandardWorkingDay(year, month, previousDay, nonWorkingDates)) {
        reductionHours += 1;
      }
    }

    return -reductionHours;
  },
};

/** Ordered list of adjustments applied to the standard monthly norm. Add future rules here. */
export const STANDARD_MONTH_RULES: readonly WorkingTimeRule[] = [preHolidayShortenedDayRule];

export interface MonthlyHoursBreakdown {
  year: number;
  month: number;
  employmentType: EmploymentType;
  employmentFraction: number;
  calendarDays: number;
  /** Standard Mon-Fri days in the month that are not public/company holidays. */
  workingDays: number;
  /** workingDays * 8, before rule adjustments. */
  baseHours: number;
  /** Total hours subtracted by STANDARD_MONTH_RULES (e.g. pre-holiday shortened days). Always >= 0. */
  ruleReductionHours: number;
  /** Final required hours for the month: (baseHours - ruleReductionHours) * employmentFraction, rounded to 2 decimals. */
  requiredHours: number;
  /** Public/company holidays that fall within this month, for the UI to explain the calculation. */
  holidaysInMonth: HolidayDefinition[];
}

export interface CalculateMonthlyHoursParams {
  year: number;
  month: number;
  employmentType: EmploymentType;
  /** Every public + company-specific holiday, already filtered to (or provided for) this month. */
  holidaysInMonth: HolidayDefinition[];
}

export function calculateMonthlyRequiredHours(params: CalculateMonthlyHoursParams): MonthlyHoursBreakdown {
  const { year, month, employmentType, holidaysInMonth } = params;
  const nonWorkingDates = new Set(holidaysInMonth.map((h) => h.date));

  const calendarDays = daysInMonth(year, month);
  let workingDays = 0;
  for (let day = 1; day <= calendarDays; day += 1) {
    if (isStandardWorkingDay(year, month, day, nonWorkingDates)) {
      workingDays += 1;
    }
  }

  const baseHours = workingDays * 8;
  const ruleReductionHours = STANDARD_MONTH_RULES.reduce(
    (total, rule) => total - rule.computeHourDelta({ year, month, nonWorkingDates }),
    0,
  );

  const employmentFraction = EMPLOYMENT_FRACTIONS[employmentType];
  const requiredHours = Math.round((baseHours - ruleReductionHours) * employmentFraction * 100) / 100;

  return {
    year,
    month,
    employmentType,
    employmentFraction,
    calendarDays,
    workingDays,
    baseHours,
    ruleReductionHours,
    requiredHours,
    holidaysInMonth,
  };
}
