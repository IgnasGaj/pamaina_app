import { companyRepository } from "@/modules/companies/company.repository";
import { companySettingsRepository } from "@/modules/companies/company-settings.repository";
import { departmentRepository } from "@/modules/departments/department.repository";
import { employeeRepository } from "@/modules/employees/employee.repository";
import { absenceTypeRepository } from "@/modules/absence-types/absence-type.repository";
import { companyNonWorkingDayRepository } from "@/modules/working-time/company-non-working-day.repository";
import { getDefaultLithuanianHolidays, HolidayDefinition } from "@/modules/working-time/lithuanian-holidays";
import { calculateMonthlyRequiredHours } from "@/modules/working-time/working-time-engine.service";
import { scheduleExportRepository, ScheduleForExport } from "@/modules/schedule-export/schedule-export.repository";
import { ExportScheduleDto } from "@/modules/schedule-export/schedule-export.dto";
import {
  ScheduleExportAbsenceTotals,
  ScheduleExportData,
  ScheduleExportDayCell,
  ScheduleExportEmployeeRow,
} from "@/modules/schedule-export/schedule-export.types";
import { BadRequestError, NotFoundError } from "@/shared/errors";
import { EmploymentType } from "@prisma/client";

const NO_PUBLISHED_SCHEDULE_MESSAGE = "Nepaskelbtam grafikui eksportas negalimas.";

/** Lithuanian month names in the genitive case, matching the official form's title style ("... GEGUŽĖS MĖN."). */
const MONTH_NAMES_GENITIVE = [
  "Sausio",
  "Vasario",
  "Kovo",
  "Balandžio",
  "Gegužės",
  "Birželio",
  "Liepos",
  "Rugpjūčio",
  "Rugsėjo",
  "Spalio",
  "Lapkričio",
  "Gruodžio",
];

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours ?? 0) * 60 + (minutes ?? 0);
}

/** Mirrors apps/frontend/src/lib/monthly-hours.ts:calculateShiftDurationHours — same formula, kept local since there's no shared package between the two apps. */
function calculateShiftDurationHours(template: { startTime: string; endTime: string; breakMinutes: number }): number {
  const start = timeToMinutes(template.startTime);
  const end = timeToMinutes(template.endTime);
  const spanMinutes = end > start ? end - start : 24 * 60 - start + end;
  const workedMinutes = Math.max(0, spanMinutes - template.breakMinutes);
  return workedMinutes / 60;
}

/** "13:00" -> "13.00", matching the template's dot-separated time notation. */
function formatTimeDot(time: string): string {
  const [hours, minutes] = time.split(":");
  return `${Number(hours)}.${minutes}`;
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function getHolidaysInMonth(companyId: string, year: number, month: number): Promise<HolidayDefinition[]> {
  const defaults = getDefaultLithuanianHolidays(year);
  const companyDays = await companyNonWorkingDayRepository.findAllForCompany(companyId);
  const custom = companyDays
    .filter((entry) => entry.date.getUTCFullYear() === year)
    .map((entry) => ({ date: dateKey(entry.date), name: entry.name }));

  const prefix = `${year}-${String(month).padStart(2, "0")}-`;
  return [...defaults, ...custom]
    .filter((h) => h.date.startsWith(prefix))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function buildEmployeeRow(
  employee: ScheduleForExport["assignments"][number]["employee"],
  assignments: ScheduleForExport["assignments"],
  totalDays: number,
  requiredHoursByType: Map<EmploymentType, number>,
): ScheduleExportEmployeeRow {
  const byDay = new Map<number, ScheduleForExport["assignments"][number]>();
  for (const assignment of assignments) {
    if (assignment.employeeId !== employee.id) continue;
    const day = assignment.date.getUTCDate();
    byDay.set(day, assignment);
  }

  const days: ScheduleExportDayCell[] = [];
  const absenceDayCounts: ScheduleExportAbsenceTotals = {};
  let totalWorkedHours = 0;

  for (let day = 1; day <= totalDays; day += 1) {
    const assignment = byDay.get(day);
    if (!assignment) {
      days.push({ day, timeText: "", durationValue: "" });
      continue;
    }

    if (assignment.shiftTemplate) {
      const duration = roundHours(calculateShiftDurationHours(assignment.shiftTemplate));
      totalWorkedHours += duration;
      days.push({
        day,
        timeText: `${formatTimeDot(assignment.shiftTemplate.startTime)}-${formatTimeDot(assignment.shiftTemplate.endTime)}`,
        durationValue: duration,
      });
    } else if (assignment.absenceType) {
      const code = assignment.absenceType.code;
      absenceDayCounts[code] = (absenceDayCounts[code] ?? 0) + 1;
      days.push({ day, timeText: code, durationValue: code });
    } else {
      days.push({ day, timeText: "", durationValue: "" });
    }
  }

  return {
    employeeId: employee.id,
    fullName: `${employee.firstName} ${employee.lastName}`,
    departmentName: employee.department?.name ?? null,
    positionName: employee.position?.title ?? null,
    days,
    totalWorkedHours: roundHours(totalWorkedHours),
    requiredHours: requiredHoursByType.get(employee.employmentType) ?? 0,
    absenceDayCounts,
  };
}

export async function buildScheduleExportData(companyId: string, dto: ExportScheduleDto): Promise<ScheduleExportData> {
  const [company, settings, schedule, absenceTypesResult] = await Promise.all([
    companyRepository.findById(companyId),
    companySettingsRepository.findByCompanyId(companyId),
    scheduleExportRepository.findByYearMonthInCompany(dto.year, dto.month, companyId),
    absenceTypeRepository.findMany(companyId, { page: 1, pageSize: 100 }),
  ]);

  if (!company) {
    throw new NotFoundError("Company");
  }
  if (!schedule) {
    throw new BadRequestError(NO_PUBLISHED_SCHEDULE_MESSAGE);
  }
  if (schedule.status !== "PUBLISHED" && !dto.includeUnpublished) {
    throw new BadRequestError(NO_PUBLISHED_SCHEDULE_MESSAGE);
  }

  let departmentName: string | null = null;
  if (dto.departmentId) {
    const department = await departmentRepository.findByIdInCompany(dto.departmentId, companyId);
    if (!department) {
      throw new NotFoundError("Department");
    }
    departmentName = department.name;
  }

  let targetEmployeeIds: Set<string> | null = null;
  if (dto.employeeId) {
    const employee = await employeeRepository.findByIdInCompany(dto.employeeId, companyId);
    if (!employee) {
      throw new NotFoundError("Employee");
    }
    targetEmployeeIds = new Set([employee.id]);
  }

  const totalDays = daysInMonth(dto.year, dto.month);
  const holidaysInMonth = await getHolidaysInMonth(companyId, dto.year, dto.month);

  const employeesById = new Map<string, ScheduleForExport["assignments"][number]["employee"]>();
  for (const assignment of schedule.assignments) {
    if (dto.departmentId && assignment.employee.departmentId !== dto.departmentId) continue;
    if (targetEmployeeIds && !targetEmployeeIds.has(assignment.employeeId)) continue;
    employeesById.set(assignment.employeeId, assignment.employee);
  }

  const distinctEmploymentTypes = new Set(Array.from(employeesById.values()).map((e) => e.employmentType));
  const requiredHoursByType = new Map<EmploymentType, number>();
  for (const employmentType of distinctEmploymentTypes) {
    const breakdown = calculateMonthlyRequiredHours({
      year: dto.year,
      month: dto.month,
      employmentType,
      holidaysInMonth,
    });
    requiredHoursByType.set(employmentType, breakdown.requiredHours);
  }

  const employees = Array.from(employeesById.values())
    .sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName))
    .map((employee) => buildEmployeeRow(employee, schedule.assignments, totalDays, requiredHoursByType));

  return {
    company: {
      name: company.name,
      legalCode: company.legalCode,
      logoUrl: settings?.logoUrl ?? null,
    },
    departmentName,
    year: dto.year,
    month: dto.month,
    daysInMonth: totalDays,
    monthLabelGenitive: MONTH_NAMES_GENITIVE[dto.month - 1] ?? "",
    signatureName: dto.signatureName ?? "",
    generatedAt: new Date().toISOString(),
    isPublished: schedule.status === "PUBLISHED",
    absenceLegend: absenceTypesResult.items
      .filter((absenceType) => absenceType.isDefault && absenceType.active)
      .map((absenceType) => ({ code: absenceType.code, name: absenceType.name })),
    holidaysInMonth,
    employees,
  };
}
