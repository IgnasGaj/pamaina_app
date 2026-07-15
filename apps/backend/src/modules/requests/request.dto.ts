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
});
export type ReviewRequestDto = z.infer<typeof reviewRequestSchema>;

export const requestIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listRequestsQuerySchema = paginationQuerySchema.extend({
  status: requestStatusSchema.optional(),
  employeeId: z.string().uuid().optional(),
});
export type ListRequestsQuery = z.infer<typeof listRequestsQuerySchema>;

export const requestResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  absenceTypeId: z.string().uuid(),
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
