import { AbsenceType } from "@prisma/client";
import { AbsenceTypeResponseDto } from "@/modules/absence-types/absence-type.dto";

export function toAbsenceTypeResponseDto(absenceType: AbsenceType): AbsenceTypeResponseDto {
  return {
    id: absenceType.id,
    companyId: absenceType.companyId,
    code: absenceType.code,
    name: absenceType.name,
    color: absenceType.color,
    description: absenceType.description,
    isDefault: absenceType.isDefault,
    active: absenceType.active,
    createdAt: absenceType.createdAt.toISOString(),
    updatedAt: absenceType.updatedAt.toISOString(),
  };
}
