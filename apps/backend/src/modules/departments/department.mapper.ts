import { DepartmentWithCount } from "@/modules/departments/department.repository";
import { DepartmentResponseDto } from "@/modules/departments/department.dto";

export function toDepartmentResponseDto(department: DepartmentWithCount): DepartmentResponseDto {
  return {
    id: department.id,
    companyId: department.companyId,
    name: department.name,
    description: department.description,
    color: department.color,
    isActive: department.isActive,
    isArchived: department.deletedAt !== null,
    employeeCount: department._count.employees,
    createdAt: department.createdAt.toISOString(),
  };
}
