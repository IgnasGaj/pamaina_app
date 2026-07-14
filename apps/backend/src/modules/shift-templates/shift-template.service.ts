import { shiftTemplateRepository } from "@/modules/shift-templates/shift-template.repository";
import { toShiftTemplateResponseDto } from "@/modules/shift-templates/shift-template.mapper";
import {
  CreateShiftTemplateDto,
  ListShiftTemplatesQuery,
  ShiftTemplateResponseDto,
  UpdateShiftTemplateDto,
} from "@/modules/shift-templates/shift-template.dto";
import { BadRequestError, ConflictError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

/** Overnight shifts (e.g. 22:00-06:00) are valid — only exact equality is nonsensical. */
function assertStartAndEndDiffer(startTime: string, endTime: string): void {
  if (startTime === endTime) {
    throw new BadRequestError("Start time and end time cannot be the same");
  }
}

export async function createShiftTemplate(
  companyId: string,
  dto: CreateShiftTemplateDto,
): Promise<ShiftTemplateResponseDto> {
  assertStartAndEndDiffer(dto.startTime, dto.endTime);

  const nameTaken = await shiftTemplateRepository.findByNameInCompany(dto.name, companyId);
  if (nameTaken) {
    throw new ConflictError("A shift template with this name already exists");
  }
  const codeTaken = await shiftTemplateRepository.findByShortCodeInCompany(dto.shortCode, companyId);
  if (codeTaken) {
    throw new ConflictError("A shift template with this short code already exists");
  }

  const template = await shiftTemplateRepository.create({
    companyId,
    name: dto.name,
    shortCode: dto.shortCode,
    color: dto.color,
    startTime: dto.startTime,
    endTime: dto.endTime,
    breakMinutes: dto.breakMinutes,
  });
  return toShiftTemplateResponseDto(template);
}

export async function getShiftTemplateByIdOrThrow(companyId: string, id: string): Promise<ShiftTemplateResponseDto> {
  const template = await shiftTemplateRepository.findByIdInCompany(id, companyId);
  if (!template) {
    throw new NotFoundError("Shift template");
  }
  return toShiftTemplateResponseDto(template);
}

export async function updateShiftTemplate(
  companyId: string,
  id: string,
  dto: UpdateShiftTemplateDto,
): Promise<ShiftTemplateResponseDto> {
  const existing = await shiftTemplateRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Shift template");
  }

  const nextStartTime = dto.startTime ?? existing.startTime;
  const nextEndTime = dto.endTime ?? existing.endTime;
  assertStartAndEndDiffer(nextStartTime, nextEndTime);

  if (dto.name && dto.name !== existing.name) {
    const nameTaken = await shiftTemplateRepository.findByNameInCompany(dto.name, companyId);
    if (nameTaken) {
      throw new ConflictError("A shift template with this name already exists");
    }
  }
  if (dto.shortCode && dto.shortCode !== existing.shortCode) {
    const codeTaken = await shiftTemplateRepository.findByShortCodeInCompany(dto.shortCode, companyId);
    if (codeTaken) {
      throw new ConflictError("A shift template with this short code already exists");
    }
  }

  const updated = await shiftTemplateRepository.update(id, dto);
  return toShiftTemplateResponseDto(updated);
}

export async function listShiftTemplates(
  companyId: string,
  query: ListShiftTemplatesQuery,
): Promise<PaginatedResult<ShiftTemplateResponseDto>> {
  const { items, total } = await shiftTemplateRepository.findMany(
    companyId,
    { search: query.search, status: query.status },
    { sortBy: query.sortBy, sortOrder: query.sortOrder },
    query,
  );
  return buildPaginatedResult(items.map(toShiftTemplateResponseDto), query, total);
}

export async function archiveShiftTemplate(companyId: string, id: string): Promise<ShiftTemplateResponseDto> {
  const existing = await shiftTemplateRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Shift template");
  }
  await shiftTemplateRepository.archive(id);
  const updated = await shiftTemplateRepository.findByIdInCompany(id, companyId);
  return toShiftTemplateResponseDto(updated!);
}

export async function restoreShiftTemplate(companyId: string, id: string): Promise<ShiftTemplateResponseDto> {
  const existing = await shiftTemplateRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Shift template");
  }
  await shiftTemplateRepository.restore(id);
  const updated = await shiftTemplateRepository.findByIdInCompany(id, companyId);
  return toShiftTemplateResponseDto(updated!);
}
