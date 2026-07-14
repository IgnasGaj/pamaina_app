import { companyNonWorkingDayRepository } from "@/modules/working-time/company-non-working-day.repository";
import { getDefaultLithuanianHolidays, HolidayDefinition } from "@/modules/working-time/lithuanian-holidays";
import { calculateMonthlyRequiredHours } from "@/modules/working-time/working-time-engine.service";
import {
  toCompanyNonWorkingDayResponseDto,
  toHolidayResponseDto,
  toMonthlyHoursResponseDto,
} from "@/modules/working-time/working-time.mapper";
import {
  CompanyNonWorkingDayResponseDto,
  CreateNonWorkingDayDto,
  HolidayResponseDto,
  HolidaysQuery,
  MonthlyHoursQuery,
  MonthlyHoursResponseDto,
} from "@/modules/working-time/working-time.dto";
import { ConflictError, NotFoundError } from "@/shared/errors";

interface TaggedHoliday extends HolidayDefinition {
  source: "default" | "company";
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Merges the year's official holidays with a company's custom non-working days, sorted by date. */
async function getAllHolidaysForYear(companyId: string, year: number): Promise<TaggedHoliday[]> {
  const defaults = getDefaultLithuanianHolidays(year).map((h) => ({ ...h, source: "default" as const }));
  const companyDays = await companyNonWorkingDayRepository.findAllForCompany(companyId);
  const custom = companyDays
    .filter((entry) => entry.date.getUTCFullYear() === year)
    .map((entry) => ({ date: dateKey(entry.date), name: entry.name, source: "company" as const }));
  return [...defaults, ...custom].sort((a, b) => a.date.localeCompare(b.date));
}

function isInMonth(dateStr: string, year: number, month: number): boolean {
  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return dateStr.startsWith(prefix);
}

export async function listHolidays(companyId: string, query: HolidaysQuery): Promise<HolidayResponseDto[]> {
  const all = await getAllHolidaysForYear(companyId, query.year);
  const filtered = query.month ? all.filter((h) => isInMonth(h.date, query.year, query.month!)) : all;
  return filtered.map((h) => toHolidayResponseDto(h, h.source));
}

export async function getMonthlyHours(companyId: string, query: MonthlyHoursQuery): Promise<MonthlyHoursResponseDto> {
  const allHolidays = await getAllHolidaysForYear(companyId, query.year);
  const holidaysInMonth = allHolidays.filter((h) => isInMonth(h.date, query.year, query.month));

  const breakdown = calculateMonthlyRequiredHours({
    year: query.year,
    month: query.month,
    employmentType: query.employmentType,
    holidaysInMonth,
  });

  const holidayDtos = holidaysInMonth.map((h) => toHolidayResponseDto(h, h.source));
  return toMonthlyHoursResponseDto(breakdown, holidayDtos);
}

export async function listCompanyNonWorkingDays(companyId: string): Promise<CompanyNonWorkingDayResponseDto[]> {
  const entries = await companyNonWorkingDayRepository.findAllForCompany(companyId);
  return entries.map(toCompanyNonWorkingDayResponseDto);
}

export async function createCompanyNonWorkingDay(
  companyId: string,
  dto: CreateNonWorkingDayDto,
): Promise<CompanyNonWorkingDayResponseDto> {
  const existing = await companyNonWorkingDayRepository.findByDateInCompany(dto.date, companyId);
  if (existing) {
    throw new ConflictError("A non-working day already exists for this date");
  }
  const created = await companyNonWorkingDayRepository.create({ companyId, date: dto.date, name: dto.name });
  return toCompanyNonWorkingDayResponseDto(created);
}

export async function deleteCompanyNonWorkingDay(companyId: string, id: string): Promise<void> {
  const existing = await companyNonWorkingDayRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Non-working day");
  }
  await companyNonWorkingDayRepository.delete(id);
}
