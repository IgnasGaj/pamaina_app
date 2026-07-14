import { z } from "zod";
import { ContractStatus, ContractType, WorkWeek } from "@prisma/client";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const contractStatusSchema = z.nativeEnum(ContractStatus);
export const contractTypeSchema = z.nativeEnum(ContractType);
export const workWeekSchema = z.nativeEnum(WorkWeek);

const dateRangeRefinement = (data: { startDate: Date; endDate?: Date | null }, ctx: z.RefinementCtx) => {
  if (data.endDate && data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after the start date",
      path: ["endDate"],
    });
  }
};

export const createContractSchema = z
  .object({
    employeeId: z.string().uuid(),
    departmentId: z.string().uuid().optional(),
    positionId: z.string().uuid().optional(),
    contractNumber: z.string().min(1).max(50).optional(),
    status: contractStatusSchema.default("ACTIVE"),
    contractType: contractTypeSchema,
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    probationEndDate: z.coerce.date().nullable().optional(),
    weeklyHours: z.coerce.number().positive().max(168).default(40),
    dailyHours: z.coerce.number().positive().max(24).default(8),
    fte: z.coerce.number().min(0.1).max(1.0).default(1.0),
    workWeek: workWeekSchema.default("FIVE_DAY"),
    vacationDaysPerYear: z.coerce.number().int().nonnegative().default(20),
    summarizedWorkingTime: z.boolean().default(false),
    canWorkWeekends: z.boolean().default(true),
    canWorkHolidays: z.boolean().default(false),
    canWorkNights: z.boolean().default(true),
    notes: z.string().max(2000).optional(),
  })
  .superRefine(dateRangeRefinement);
export type CreateContractDto = z.infer<typeof createContractSchema>;

export const updateContractSchema = z
  .object({
    departmentId: z.string().uuid().nullable().optional(),
    positionId: z.string().uuid().nullable().optional(),
    contractNumber: z.string().min(1).max(50).optional(),
    status: contractStatusSchema.optional(),
    contractType: contractTypeSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
    probationEndDate: z.coerce.date().nullable().optional(),
    weeklyHours: z.coerce.number().positive().max(168).optional(),
    dailyHours: z.coerce.number().positive().max(24).optional(),
    fte: z.coerce.number().min(0.1).max(1.0).optional(),
    workWeek: workWeekSchema.optional(),
    vacationDaysPerYear: z.coerce.number().int().nonnegative().optional(),
    summarizedWorkingTime: z.boolean().optional(),
    canWorkWeekends: z.boolean().optional(),
    canWorkHolidays: z.boolean().optional(),
    canWorkNights: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      dateRangeRefinement({ startDate: data.startDate, endDate: data.endDate }, ctx);
    }
  });
export type UpdateContractDto = z.infer<typeof updateContractSchema>;

export const endContractSchema = z.object({
  endDate: z.coerce.date().optional(),
});
export type EndContractDto = z.infer<typeof endContractSchema>;

export const contractIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listContractsQuerySchema = paginationQuerySchema.extend({
  employeeId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  status: contractStatusSchema.optional(),
});
export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>;

export const contractResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  employeeName: z.string(),
  departmentId: z.string().uuid().nullable(),
  departmentName: z.string().nullable(),
  positionId: z.string().uuid().nullable(),
  positionTitle: z.string().nullable(),
  contractNumber: z.string(),
  status: contractStatusSchema,
  contractType: contractTypeSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
  probationEndDate: z.string().nullable(),
  weeklyHours: z.number(),
  dailyHours: z.number(),
  fte: z.number(),
  workWeek: workWeekSchema,
  vacationDaysPerYear: z.number().int(),
  summarizedWorkingTime: z.boolean(),
  canWorkWeekends: z.boolean(),
  canWorkHolidays: z.boolean(),
  canWorkNights: z.boolean(),
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ContractResponseDto = z.infer<typeof contractResponseSchema>;
