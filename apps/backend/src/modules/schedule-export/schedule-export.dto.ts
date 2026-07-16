import { z } from "zod";

/**
 * Only one official template ships today, but the key is validated as an enum
 * (not hardcoded elsewhere) so a second template can be added later purely by
 * extending this list + template-loader.ts, without touching the mapper/filler.
 */
export const scheduleExportTemplateKeySchema = z.enum(["lt-official-2016"]);
export type ScheduleExportTemplateKey = z.infer<typeof scheduleExportTemplateKeySchema>;

export const scheduleExportFormatSchema = z.enum(["xlsx", "pdf"]);
export type ScheduleExportFormat = z.infer<typeof scheduleExportFormatSchema>;

export const exportScheduleSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  departmentId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  includeUnpublished: z.boolean().default(false),
  signatureName: z.string().max(200).optional(),
  format: scheduleExportFormatSchema,
  templateKey: scheduleExportTemplateKeySchema.default("lt-official-2016"),
});
export type ExportScheduleDto = z.infer<typeof exportScheduleSchema>;
