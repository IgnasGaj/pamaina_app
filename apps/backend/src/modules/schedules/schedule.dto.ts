import { z } from "zod";
import { ScheduleStatus } from "@prisma/client";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const scheduleStatusSchema = z.nativeEnum(ScheduleStatus);

export const createScheduleSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});
export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;

export const updateScheduleSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});
export type UpdateScheduleDto = z.infer<typeof updateScheduleSchema>;

export const scheduleIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listSchedulesQuerySchema = paginationQuerySchema.extend({
  year: z.coerce.number().int().optional(),
  month: z.coerce.number().int().optional(),
  status: scheduleStatusSchema.optional(),
});
export type ListSchedulesQuery = z.infer<typeof listSchedulesQuerySchema>;

/** Exactly one of shiftTemplateId/absenceTypeId must be set — never both, never neither. */
const exactlyOneAssignmentKindRefinement = (
  data: { shiftTemplateId?: string | null; absenceTypeId?: string | null },
  ctx: z.RefinementCtx,
): void => {
  const hasShift = Boolean(data.shiftTemplateId);
  const hasAbsence = Boolean(data.absenceTypeId);
  if (hasShift === hasAbsence) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Provide exactly one of shiftTemplateId or absenceTypeId",
      path: ["shiftTemplateId"],
    });
  }
};

export const createAssignmentSchema = z
  .object({
    scheduleId: z.string().uuid(),
    employeeId: z.string().uuid(),
    date: z.coerce.date(),
    shiftTemplateId: z.string().uuid().optional(),
    absenceTypeId: z.string().uuid().optional(),
    notes: z.string().max(500).optional(),
  })
  .superRefine(exactlyOneAssignmentKindRefinement);
export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z
  .object({
    shiftTemplateId: z.string().uuid().nullable(),
    absenceTypeId: z.string().uuid().nullable(),
    notes: z.string().max(500).nullable().optional(),
  })
  .superRefine(exactlyOneAssignmentKindRefinement);
export type UpdateAssignmentDto = z.infer<typeof updateAssignmentSchema>;

export const assignmentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const scheduleAssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  date: z.string(),
  shiftTemplateId: z.string().uuid().nullable(),
  absenceTypeId: z.string().uuid().nullable(),
  notes: z.string().nullable(),
  updatedBy: z.string().uuid().nullable(),
  updatedByName: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ScheduleAssignmentResponseDto = z.infer<typeof scheduleAssignmentResponseSchema>;

const scheduleFieldsSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  year: z.number().int(),
  month: z.number().int(),
  status: scheduleStatusSchema,
  createdBy: z.string().uuid(),
  updatedBy: z.string().uuid().nullable(),
  updatedByName: z.string().nullable(),
  publishedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/** Lightweight shape for GET /schedules — omits assignments to keep list payloads small. */
export const scheduleSummaryResponseSchema = scheduleFieldsSchema.extend({
  assignmentCount: z.number().int(),
});
export type ScheduleSummaryDto = z.infer<typeof scheduleSummaryResponseSchema>;

/** Full shape for GET/POST /schedules/:id and friends — includes every assignment for the month grid. */
export const scheduleResponseSchema = scheduleFieldsSchema.extend({
  assignments: z.array(scheduleAssignmentResponseSchema),
});
export type ScheduleResponseDto = z.infer<typeof scheduleResponseSchema>;
