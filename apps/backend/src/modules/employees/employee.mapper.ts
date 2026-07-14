import { Employee } from "@prisma/client";
import { EmployeeResponseDto } from "@/modules/employees/employee.dto";

export function toEmployeeResponseDto(employee: Employee): EmployeeResponseDto {
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
    status: employee.status,
    isActive: employee.isActive,
    createdAt: employee.createdAt.toISOString(),
  };
}
