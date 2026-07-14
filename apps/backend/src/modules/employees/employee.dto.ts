import { z } from "zod";
import { EmployeeStatus, EmploymentType } from "@prisma/client";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const employeeSortBySchema = z.enum(["name", "createdAt"]);
export type EmployeeSortBy = z.infer<typeof employeeSortBySchema>;

export const employmentTypeSchema = z.nativeEnum(EmploymentType);

const dateRangeRefinement = (data: { startDate: Date; endDate?: Date | null }, ctx: z.RefinementCtx) => {
  if (data.endDate && data.endDate <= data.startDate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "End date must be after the start date",
      path: ["endDate"],
    });
  }
};

export const createEmployeeSchema = z
  .object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
    email: z.string().email().optional(),
    phone: z.string().max(30).optional(),
    departmentId: z.string().uuid().optional(),
    positionId: z.string().uuid().optional(),
    employmentType: employmentTypeSchema.default("FULL_TIME"),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().nullable().optional(),
    notes: z.string().max(2000).optional(),
    employeeCode: z.string().min(1).max(50).optional(),
  })
  .superRefine(dateRangeRefinement);
export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().max(30).nullable().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    positionId: z.string().uuid().nullable().optional(),
    employmentType: employmentTypeSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    // Only ACTIVE/INACTIVE are settable here; ARCHIVED is only reachable via
    // the dedicated archive endpoint so it always stays in lockstep with
    // deletedAt/isActive (see employee.repository.ts#archive).
    status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.endDate) {
      dateRangeRefinement({ startDate: data.startDate, endDate: data.endDate }, ctx);
    }
  });
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;

export const employeeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listEmployeesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  sortBy: employeeSortBySchema.default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});
export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

export const employeeResponseSchema = z.object({
  id: z.string().uuid(),
  companyId: z.string().uuid(),
  userId: z.string().uuid().nullable(),
  employeeCode: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  departmentId: z.string().uuid().nullable(),
  departmentName: z.string().nullable(),
  positionId: z.string().uuid().nullable(),
  positionTitle: z.string().nullable(),
  employmentType: employmentTypeSchema,
  startDate: z.string(),
  endDate: z.string().nullable(),
  notes: z.string().nullable(),
  status: z.nativeEnum(EmployeeStatus),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type EmployeeResponseDto = z.infer<typeof employeeResponseSchema>;
