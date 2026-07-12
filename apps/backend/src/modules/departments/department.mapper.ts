import { DepartmentWithCount } from "@/modules/departments/department.repository";
import { DepartmentResponseDto } from "@/modules/departments/department.dto";

export function toDepartmentResponseDto(department: DepartmentWithCount): DepartmentResponseDto {
  return {
    id: department.id,
    companyId: department.companyId,
    name: department.name,
    description: department.description,
    isActive: department.isActive,
    employeeCount: department._count.employees,
    createdAt: department.createdAt.toISOString(),
  };
}
