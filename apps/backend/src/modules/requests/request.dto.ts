import { z } from "zod";
import { RequestStatus } from "@prisma/client";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const requestStatusSchema = z.nativeEnum(RequestStatus);

const dateRangeRefinement = (data: { startDate: Date; endDate: Date }, ctx: z.RefinementCtx) => {
  if (data.endDate < data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be on or after the start date",
      path: ["endDate"],
    });
  }
};

export const createRequestSchema = z
  .object({
    absenceTypeId: z.string().uuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    comment: z.string().max(1000).optional(),
    /// Only honored when the caller is a manager acting on an employee's
    /// behalf — a self-service employee's own id is always used instead,
    /// regardless of what this field contains (see request.controller.ts).
    employeeId: z.string().uuid().optional(),
  })
  .superRefine(dateRangeRefinement);
export type CreateRequestDto = z.infer<typeof createRequestSchema>;

export const reviewRequestSchema = z.object({
  reviewComment: z.string().max(1000).optional(),
  /// Only meaningful for approve: how to handle days where the employee
  /// already has a shift scheduled. Defaults to removing the conflicting
  /// shift, matching the approval-conflict dialog's recommended default.
  conflictResolution: z.enum(["remove", "keep"]).default("remove"),
});
export type ReviewRequestDto = z.infer<typeof reviewRequestSchema>;

export const requestIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listRequestsQuerySchema = paginationQuerySchema.extend({
  status: requestStatusSchema.optional(),
  employeeId: z.string().uuid().optional(),
  /// Filters by the request's startDate, inclusive — lets dashboards ask for
  /// "upcoming" approved leave without pulling every approved request ever.
  startDateFrom: z.coerce.date().optional(),
  startDateTo: z.coerce.date().optional(),
});
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;

export const conflictPreviewEntrySchema = z.object({
  date: z.string(),
  shiftTemplateName: z.string(),
});
export type ConflictPreviewEntryDto = z.infer<typeof conflictPreviewEntrySchema>;

export const requestResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  absenceTypeId: z.string().uuid(),
  absenceTypeCode: z.string(),
  absenceTypeName: z.string(),
  absenceTypeColor: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  comment: z.string().nullable(),
  status: requestStatusSchema,
  reviewedBy: z.string().uuid().nullable(),
  reviewerName: z.string().nullable(),
  reviewedAt: z.string().nullable(),
  reviewComment: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type RequestResponseDto = z.infer<typeof requestResponseSchema>;
