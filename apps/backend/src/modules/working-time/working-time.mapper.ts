import { CompanyNonWorkingDay } from "@prisma/client";
import { HolidayDefinition } from "@/modules/working-time/lithuanian-holidays";
import { MonthlyHoursBreakdown } from "@/modules/working-time/working-time-engine.service";
import {
  CompanyNonWorkingDayResponseDto,
  HolidayResponseDto,
  MonthlyHoursResponseDto,
} from "@/modules/working-time/working-time.dto";

export function toHolidayResponseDto(holiday: HolidayDefinition, source: "default" | "company"): HolidayResponseDto {
  return { date: holiday.date, name: holiday.name, source };
}

export function toMonthlyHoursResponseDto(
  breakdown: MonthlyHoursBreakdown,
  holidayDtos: HolidayResponseDto[],
): MonthlyHoursResponseDto {
  return {
    year: breakdown.year,
    month: breakdown.month,
    employmentType: breakdown.employmentType,
    employmentFraction: breakdown.employmentFraction,
    calendarDays: breakdown.calendarDays,
    workingDays: breakdown.workingDays,
    baseHours: breakdown.baseHours,
    ruleReductionHours: breakdown.ruleReductionHours,
    requiredHours: breakdown.requiredHours,
    holidays: holidayDtos,
  };
}

export function toCompanyNonWorkingDayResponseDto(entry: CompanyNonWorkingDay): CompanyNonWorkingDayResponseDto {
  return {
    id: entry.id,
    companyId: entry.companyId,
    date: entry.date.toISOString().slice(0, 10),
    name: entry.name,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}
