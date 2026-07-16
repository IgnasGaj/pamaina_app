import { Request, Response } from "express";
import * as absenceTypeService from "@/modules/absence-types/absence-type.service";
import { ListAbsenceTypesQuery, UpdateAbsenceTypeDto } from "@/modules/absence-types/absence-type.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const absenceType = await absenceTypeService.getAbsenceTypeByIdOrThrow(req.user!.companyId!, id);
  sendSuccess(res, absenceType);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const absenceType = await absenceTypeService.updateAbsenceType(
    req.user!.companyId!,
    id,
    req.body as UpdateAbsenceTypeDto,
  );
  sendSuccess(res, absenceType);
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await absenceTypeService.listAbsenceTypes(
    req.user!.companyId!,
    req.query as unknown as ListAbsenceTypesQuery,
  );
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}
