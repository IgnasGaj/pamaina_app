import { Request, Response } from "express";
import * as scheduleExportService from "@/modules/schedule-export/schedule-export.service";
import { ExportScheduleDto } from "@/modules/schedule-export/schedule-export.dto";

export async function exportSchedule(req: Request, res: Response): Promise<void> {
  const result = await scheduleExportService.exportSchedule(req.user!.companyId!, req.body as ExportScheduleDto);
  res.setHeader("Content-Type", result.contentType);
  res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
  res.send(result.buffer);
}
