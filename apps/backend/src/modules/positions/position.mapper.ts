import { PositionWithRelations } from "@/modules/positions/position.repository";
import { PositionResponseDto } from "@/modules/positions/position.dto";

export function toPositionResponseDto(position: PositionWithRelations): PositionResponseDto {
  return {
    id: position.id,
    companyId: position.companyId,
    departmentId: position.departmentId,
    departmentName: position.department?.name ?? null,
    title: position.title,
    description: position.description,
    isActive: position.isActive,
    employeeCount: position._count.employees,
    createdAt: position.createdAt.toISOString(),
  };
}
