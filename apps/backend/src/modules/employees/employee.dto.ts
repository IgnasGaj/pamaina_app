import { z } from "zod";
import { EmployeeStatus } from "@prisma/client";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const employeeSortBySchema = z.enum(["name", "createdAt"]);
export type EmployeeSortBy = z.infer<typeof employeeSortBySchema>;

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  personalCode: z.string().max(50).optional(),
  birthDate: z.coerce.date().optional(),
  employeeCode: z.string().min(1).max(50).optional(),
});
export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  personalCode: z.string().max(50).nullable().optional(),
  birthDate: z.coerce.date().nullable().optional(),
  // Only ACTIVE/INACTIVE are settable here; ARCHIVED is only reachable via
  // the dedicated archive endpoint so it always stays in lockstep with
  // deletedAt/isActive (see employee.repository.ts#archive).
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;

export const employeeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listEmployeesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  status: z.nativeEnum(EmployeeStatus).optional(),
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
  personalCode: z.string().nullable(),
  birthDate: z.string().nullable(),
  status: z.nativeEnum(EmployeeStatus),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type EmployeeResponseDto = z.infer<typeof employeeResponseSchema>;
