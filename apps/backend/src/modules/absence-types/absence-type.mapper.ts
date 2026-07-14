import { AbsenceType } from "@prisma/client";
import { AbsenceTypeResponseDto } from "@/modules/absence-types/absence-type.dto";

export function toAbsenceTypeResponseDto(absenceType: AbsenceType): AbsenceTypeResponseDto {
  return {
    id: absenceType.id,
    companyId: absenceType.companyId,
    name: absenceType.name,
    color: absenceType.color,
    paid: absenceType.paid,
    active: absenceType.active,
    createdAt: absenceType.createdAt.toISOString(),
    updatedAt: absenceType.updatedAt.toISOString(),
  };
}
