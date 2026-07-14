import { EmployeeWithRelations } from "@/modules/employees/employee.repository";
import { EmployeeResponseDto } from "@/modules/employees/employee.dto";

function toDateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function toEmployeeResponseDto(employee: EmployeeWithRelations): EmployeeResponseDto {
  return {
    id: employee.id,
    companyId: employee.companyId,
    userId: employee.userId,
    employeeCode: employee.employeeCode,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    departmentId: employee.departmentId,
    departmentName: employee.department?.name ?? null,
    positionId: employee.positionId,
    positionTitle: employee.position?.title ?? null,
    employmentType: employee.employmentType,
    startDate: toDateOnly(employee.startDate) as string,
    endDate: toDateOnly(employee.endDate),
    notes: employee.notes,
    status: employee.status,
    isActive: employee.isActive,
    createdAt: employee.createdAt.toISOString(),
  };
}
