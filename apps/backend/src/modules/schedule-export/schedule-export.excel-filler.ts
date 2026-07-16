import ExcelJS from "exceljs";
import { ScheduleExportData, ScheduleExportEmployeeRow } from "@/modules/schedule-export/schedule-export.types";

/**
 * Cell coordinates decoded from the official template (see
 * schedule-export.data-mapper.ts header comment / the plan doc for how these
 * were derived). All row/col numbers are 1-indexed (ExcelJS convention).
 * Keeping every coordinate in one place means re-pointing the filler at a
 * revised template is a one-file change.
 */
const COORDS = {
  companyNameCell: { row: 1, col: 9 },
  titleCell: { row: 4, col: 8 },
  directorSignatureCell: { row: 8, col: 26 },
  legendTitleCell: { row: 29, col: 1 },
  legendCodesCell: { row: 30, col: 1 },
  preparedByCell: { row: 32, col: 19 },
  dayNumberRow: 15,
  dayOfWeekRow: 16,
  dayTotalsRow: 28,
  dayColStart: 8,
  dayColEnd: 38,
  maxDaysInTemplate: 31,
  totalHoursCol: 39,
  holidayCountCol: 40,
  /** Each employee occupies 2 rows: [timeRow, durationRow]. 5 slots fit per page. */
  employeeSlotFirstRow: 17,
  employeeSlotRowSpan: 2,
  employeeSlotsPerPage: 5,
  nameCol: 1,
  positionCol: 4,
} as const;

/** Sunday-first cycle matching the template's own day-of-week header convention. */
const WEEKDAY_LETTERS = ["S", "P", "A", "T", "K", "PN", "Š"];

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

/**
 * The template's day-column cells (8-38) sometimes arrive pre-merged in
 * pairs/runs — an artifact of however the source example happened to be
 * filled in by hand (merging visually-identical consecutive days), not a
 * structural feature every company's schedule should inherit. Each export
 * needs every day column independently settable, so any merge touching the
 * day-column range on a data row is removed before writing values.
 */
function unmergeDayColumns(worksheet: ExcelJS.Worksheet, rows: number[]): void {
  const merges = (worksheet.model.merges ?? []) as string[];
  for (const range of merges) {
    const match = /^([A-Z]+)(\d+):([A-Z]+)(\d+)$/.exec(range);
    if (!match) continue;
    const [, , startRowStr, , endRowStr] = match;
    const startRow = Number(startRowStr);
    const endRow = Number(endRowStr);
    if (rows.some((r) => r >= startRow && r <= endRow)) {
      try {
        worksheet.unMergeCells(range);
      } catch {
        // Already unmerged by a previous iteration (ranges can overlap in the raw model list) — safe to ignore.
      }
    }
  }
}

/** Deep-copies a worksheet within the SAME workbook (cross-workbook copies risk corrupting ExcelJS's shared style manager). */
function cloneMasterSheet(workbook: ExcelJS.Workbook, master: ExcelJS.Worksheet, newName: string): ExcelJS.Worksheet {
  const clone = workbook.addWorksheet(newName, {
    properties: { ...master.properties },
    pageSetup: { ...master.pageSetup },
    views: master.views,
  });

  master.columns.forEach((col, index) => {
    if (col.width) clone.getColumn(index + 1).width = col.width;
  });

  master.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    const newRow = clone.getRow(rowNumber);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const newCell = newRow.getCell(colNumber);
      newCell.value = cell.value;
      newCell.style = cell.style;
    });
    if (row.height) newRow.height = row.height;
    newRow.commit();
  });

  for (const range of (master.model.merges ?? []) as string[]) {
    clone.mergeCells(range);
  }
  clone.headerFooter = master.headerFooter;

  return clone;
}

function fillHeader(worksheet: ExcelJS.Worksheet, data: ScheduleExportData): void {
  const legalCodeSuffix = data.company.legalCode ? ` ${data.company.legalCode}` : "";
  worksheet.getCell(COORDS.companyNameCell.row, COORDS.companyNameCell.col).value =
    `${data.company.name}${legalCodeSuffix}`;

  const departmentSuffix = data.departmentName ? ` — ${data.departmentName}` : "";
  worksheet.getCell(COORDS.titleCell.row, COORDS.titleCell.col).value =
    ` DARBO LAIKO GRAFIKAS ${data.year} M. ${data.monthLabelGenitive.toUpperCase()} MĖN.${departmentSuffix}`;

  worksheet.getCell(COORDS.directorSignatureCell.row, COORDS.directorSignatureCell.col).value = "Direktorius";

  worksheet.getCell(COORDS.legendTitleCell.row, COORDS.legendTitleCell.col).value = "Žymėjimai:";
  worksheet.getCell(COORDS.legendCodesCell.row, COORDS.legendCodesCell.col).value = data.absenceLegend
    .map((entry) => `${entry.code} – ${entry.name}`)
    .join("   ");

  if (data.signatureName) {
    worksheet.getCell(COORDS.preparedByCell.row, COORDS.preparedByCell.col).value = data.signatureName;
  }
}

function fillDayHeaders(worksheet: ExcelJS.Worksheet, data: ScheduleExportData): void {
  unmergeDayColumns(worksheet, [COORDS.dayNumberRow, COORDS.dayOfWeekRow]);

  for (let offset = 0; offset < COORDS.maxDaysInTemplate; offset += 1) {
    const col = COORDS.dayColStart + offset;
    const day = offset + 1;
    if (day > data.daysInMonth) {
      worksheet.getCell(COORDS.dayNumberRow, col).value = null;
      worksheet.getCell(COORDS.dayOfWeekRow, col).value = null;
      continue;
    }
    const weekday = new Date(Date.UTC(data.year, data.month - 1, day)).getUTCDay();
    worksheet.getCell(COORDS.dayNumberRow, col).value = day;
    worksheet.getCell(COORDS.dayOfWeekRow, col).value = WEEKDAY_LETTERS[weekday];
  }
}

function fillEmployeeSlot(worksheet: ExcelJS.Worksheet, slotIndex: number, employee: ScheduleExportEmployeeRow): void {
  const timeRow = COORDS.employeeSlotFirstRow + slotIndex * COORDS.employeeSlotRowSpan;
  const durationRow = timeRow + 1;

  unmergeDayColumns(worksheet, [timeRow, durationRow]);

  worksheet.getCell(timeRow, COORDS.nameCol).value = employee.fullName;
  worksheet.getCell(timeRow, COORDS.positionCol).value = employee.positionName ?? "";

  for (const dayCell of employee.days) {
    if (dayCell.day > COORDS.maxDaysInTemplate) continue;
    const col = COORDS.dayColStart + (dayCell.day - 1);
    worksheet.getCell(timeRow, col).value = dayCell.timeText || null;
    worksheet.getCell(durationRow, col).value = dayCell.durationValue === "" ? null : dayCell.durationValue;
  }

  worksheet.getCell(timeRow, COORDS.totalHoursCol).value = employee.totalWorkedHours;
  worksheet.getCell(timeRow, COORDS.holidayCountCol).value = 0;
}

function clearEmployeeSlot(worksheet: ExcelJS.Worksheet, slotIndex: number): void {
  const timeRow = COORDS.employeeSlotFirstRow + slotIndex * COORDS.employeeSlotRowSpan;
  const durationRow = timeRow + 1;
  unmergeDayColumns(worksheet, [timeRow, durationRow]);

  worksheet.getCell(timeRow, COORDS.nameCol).value = null;
  worksheet.getCell(timeRow, COORDS.positionCol).value = null;
  for (let col = COORDS.dayColStart; col <= COORDS.dayColEnd; col += 1) {
    worksheet.getCell(timeRow, col).value = null;
    worksheet.getCell(durationRow, col).value = null;
  }
  worksheet.getCell(timeRow, COORDS.totalHoursCol).value = null;
  worksheet.getCell(timeRow, COORDS.holidayCountCol).value = null;
}

function fillDayTotalsRow(worksheet: ExcelJS.Worksheet, pageEmployees: ScheduleExportEmployeeRow[], daysInMonth: number): void {
  for (let day = 1; day <= COORDS.maxDaysInTemplate; day += 1) {
    const col = COORDS.dayColStart + (day - 1);
    if (day > daysInMonth) {
      worksheet.getCell(COORDS.dayTotalsRow, col).value = null;
      continue;
    }
    const total = pageEmployees.reduce((sum, employee) => {
      const value = employee.days[day - 1]?.durationValue;
      return typeof value === "number" ? sum + value : sum;
    }, 0);
    worksheet.getCell(COORDS.dayTotalsRow, col).value = Math.round(total * 100) / 100;
  }
}

/**
 * Fills the loaded template workbook in place. One page (worksheet) per
 * `employeeSlotsPerPage` employees — every page is a full clone of the
 * template's own formatting/merges/print setup, so borders/page size/page
 * breaks come from the original file rather than being reconstructed here.
 */
export function fillScheduleExportWorkbook(workbook: ExcelJS.Workbook, data: ScheduleExportData): void {
  const master = workbook.worksheets[0];
  if (!master) {
    throw new Error("Export template has no worksheets");
  }
  const masterName = master.name;

  const pages = chunk(data.employees, COORDS.employeeSlotsPerPage);
  if (pages.length === 0) pages.push([]);

  pages.forEach((pageEmployees, pageIndex) => {
    const worksheet = pageIndex === 0 ? master : cloneMasterSheet(workbook, master, `${masterName} (${pageIndex + 1})`);

    fillHeader(worksheet, data);
    fillDayHeaders(worksheet, data);

    for (let slot = 0; slot < COORDS.employeeSlotsPerPage; slot += 1) {
      const employee = pageEmployees[slot];
      if (employee) {
        fillEmployeeSlot(worksheet, slot, employee);
      } else {
        clearEmployeeSlot(worksheet, slot);
      }
    }

    fillDayTotalsRow(worksheet, pageEmployees, data.daysInMonth);
  });
}
