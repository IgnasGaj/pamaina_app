import { ShiftTemplate } from "@prisma/client";
import { ShiftTemplateResponseDto } from "@/modules/shift-templates/shift-template.dto";

export function toShiftTemplateResponseDto(template: ShiftTemplate): ShiftTemplateResponseDto {
  return {
    id: template.id,
    companyId: template.companyId,
    name: template.name,
    shortCode: template.shortCode,
    color: template.color,
    startTime: template.startTime,
    endTime: template.endTime,
    breakMinutes: template.breakMinutes,
    active: template.active,
    createdAt: template.createdAt.toISOString(),
    updatedAt: template.updatedAt.toISOString(),
  };
}
