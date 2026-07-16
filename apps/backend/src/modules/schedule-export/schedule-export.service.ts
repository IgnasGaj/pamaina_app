import { buildScheduleExportData } from "@/modules/schedule-export/schedule-export.data-mapper";
import { loadTemplate } from "@/modules/schedule-export/template-loader";
import { fillScheduleExportWorkbook } from "@/modules/schedule-export/schedule-export.excel-filler";
import { convertWorkbookToPdf } from "@/modules/schedule-export/schedule-export.pdf-converter";
import { ExportScheduleDto } from "@/modules/schedule-export/schedule-export.dto";

export interface ScheduleExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

const CONTENT_TYPES = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

export async function exportSchedule(companyId: string, dto: ExportScheduleDto): Promise<ScheduleExportResult> {
  const data = await buildScheduleExportData(companyId, dto);
  const workbook = await loadTemplate(dto.templateKey);
  fillScheduleExportWorkbook(workbook, data);

  const xlsxBuffer = Buffer.from(await workbook.xlsx.writeBuffer());
  const baseFilename = `Grafikas_${data.year}-${String(data.month).padStart(2, "0")}`;

  if (dto.format === "xlsx") {
    return { buffer: xlsxBuffer, filename: `${baseFilename}.xlsx`, contentType: CONTENT_TYPES.xlsx };
  }

  const pdfBuffer = await convertWorkbookToPdf(xlsxBuffer);
  return { buffer: pdfBuffer, filename: `${baseFilename}.pdf`, contentType: CONTENT_TYPES.pdf };
}
