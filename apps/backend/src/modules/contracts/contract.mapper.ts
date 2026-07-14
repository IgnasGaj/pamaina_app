import { ContractWithRelations } from "@/modules/contracts/contract.repository";
import { ContractResponseDto } from "@/modules/contracts/contract.dto";

function toDateOnly(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

export function toContractResponseDto(contract: ContractWithRelations): ContractResponseDto {
  return {
    id: contract.id,
    companyId: contract.companyId,
    employeeId: contract.employeeId,
    employeeName: `${contract.employee.firstName} ${contract.employee.lastName}`,
    departmentId: contract.departmentId,
    departmentName: contract.department?.name ?? null,
    positionId: contract.positionId,
    positionTitle: contract.position?.title ?? null,
    contractNumber: contract.contractNumber,
    status: contract.status,
    contractType: contract.contractType,
    startDate: toDateOnly(contract.startDate) as string,
    endDate: toDateOnly(contract.endDate),
    probationEndDate: toDateOnly(contract.probationEndDate),
    weeklyHours: contract.weeklyHours.toNumber(),
    dailyHours: contract.dailyHours.toNumber(),
    fte: contract.fte.toNumber(),
    workWeek: contract.workWeek,
    vacationDaysPerYear: contract.vacationDaysPerYear,
    summarizedWorkingTime: contract.summarizedWorkingTime,
    canWorkWeekends: contract.canWorkWeekends,
    canWorkHolidays: contract.canWorkHolidays,
    canWorkNights: contract.canWorkNights,
    notes: contract.notes,
    createdAt: contract.createdAt.toISOString(),
    updatedAt: contract.updatedAt.toISOString(),
  };
}
