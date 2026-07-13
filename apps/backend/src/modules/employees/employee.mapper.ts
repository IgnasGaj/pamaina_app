import { EmployeeWithRelations } from "@/modules/employees/employee.repository";
import { EmployeeResponseDto } from "@/modules/employees/employee.dto";

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
    personalCode: employee.personalCode,
    birthDate: employee.birthDate ? employee.birthDate.toISOString().slice(0, 10) : null,
    departmentId: employee.departmentId,
    departmentName: employee.department?.name ?? null,
    positionId: employee.positionId,
    positionTitle: employee.position?.title ?? null,
    employmentType: employee.employmentType,
    employmentStatus: employee.employmentStatus,
    status: employee.status,
    contractedWeeklyHours: employee.contractedWeeklyHours.toNumber(),
    hireDate: employee.hireDate.toISOString().slice(0, 10),
    terminationDate: employee.terminationDate ? employee.terminationDate.toISOString().slice(0, 10) : null,
    isActive: employee.isActive,
    createdAt: employee.createdAt.toISOString(),
  };
}
