import { HolidayDefinition } from "@/modules/working-time/lithuanian-holidays";

/** A single day's two template rows for one employee: the time-range/code row, and the numeric-duration/code row. */
export interface ScheduleExportDayCell {
  day: number;
  /** "8.00-13.00" for a shift, the AbsenceType code (e.g. "P") for an absence, "" for no assignment. */
  timeText: string;
  /** Computed shift duration in hours for a shift, the AbsenceType code for an absence, "" for no assignment. */
  durationValue: number | string;
}

export interface ScheduleExportAbsenceTotals {
  /** Keyed by AbsenceType.code (P/A/M/L, plus any legacy codes present on historical assignments). */
  [code: string]: number;
}

export interface ScheduleExportEmployeeRow {
  employeeId: string;
  fullName: string;
  departmentName: string | null;
  positionName: string | null;
  days: ScheduleExportDayCell[];
  totalWorkedHours: number;
  requiredHours: number;
  absenceDayCounts: ScheduleExportAbsenceTotals;
}

export interface ScheduleExportAbsenceLegendEntry {
  code: string;
  name: string;
}

export interface ScheduleExportData {
  company: {
    name: string;
    legalCode: string | null;
    logoUrl: string | null;
  };
  departmentName: string | null;
  year: number;
  month: number;
  daysInMonth: number;
  monthLabelGenitive: string;
  signatureName: string;
  generatedAt: string;
  isPublished: boolean;
  absenceLegend: ScheduleExportAbsenceLegendEntry[];
  holidaysInMonth: HolidayDefinition[];
  employees: ScheduleExportEmployeeRow[];
}
