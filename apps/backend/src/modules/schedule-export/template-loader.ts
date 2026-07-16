import path from "node:path";
import ExcelJS from "exceljs";
import { InternalServerError } from "@/shared/errors";
import { ScheduleExportTemplateKey } from "@/modules/schedule-export/schedule-export.dto";

/**
 * Maps a template key to its master .xlsx file. Resolved relative to this
 * file's own directory so it works identically under `tsx` (running .ts
 * directly from src/) and the compiled build (dist/ mirrors src/ 1:1 — see
 * the backend build script, which copies templates/ alongside the compiled
 * .js). Adding a second template is just one more entry here.
 */
const TEMPLATE_FILENAMES: Record<ScheduleExportTemplateKey, string> = {
  "lt-official-2016": "lt-official-2016.xlsx",
};

/** Loads a fresh Workbook for every call — ExcelJS mutates in place, and every export needs a pristine copy of the template. */
export async function loadTemplate(templateKey: ScheduleExportTemplateKey): Promise<ExcelJS.Workbook> {
  const filename = TEMPLATE_FILENAMES[templateKey];
  const filePath = path.join(__dirname, "templates", filename);

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.readFile(filePath);
  } catch {
    throw new InternalServerError(
      `Failed to load export template "${templateKey}" from ${filePath}. Make sure the template file has been placed in modules/schedule-export/templates/.`,
    );
  }
  return workbook;
}
