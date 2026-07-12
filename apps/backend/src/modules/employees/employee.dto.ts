import { z } from "zod";
import { EmploymentStatus, EmploymentType } from "@prisma/client";
import { paginationQuerySchema } from "@/shared/utils/pagination.util";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional(),
  employeeCode: z.string().min(1).max(50).optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  employmentType: z.nativeEnum(EmploymentType).default("FULL_TIME"),
  contractedWeeklyHours: z.coerce.number().positive().max(168).default(40),
  hireDate: z.coerce.date(),
});
export type CreateEmployeeDto = z.infer<typeof createEmployeeSchema>;

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(30).nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
  positionId: z.string().uuid().nullable().optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
  contractedWeeklyHours: z.coerce.number().positive().max(168).optional(),
  terminationDate: z.coerce.date().nullable().optional(),
  isActive: z.boolean().optional(),
});
export type UpdateEmployeeDto = z.infer<typeof updateEmployeeSchema>;

export const employeeIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listEmployeesQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().min(1).max(200).optional(),
  departmentId: z.string().uuid().optional(),
  positionId: z.string().uuid().optional(),
  employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
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
  employmentType: z.nativeEnum(EmploymentType),
  employmentStatus: z.nativeEnum(EmploymentStatus),
  contractedWeeklyHours: z.number(),
  hireDate: z.string(),
  terminationDate: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
export type EmployeeResponseDto = z.infer<typeof employeeResponseSchema>;
