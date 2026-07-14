import { Request, Response } from "express";
import * as shiftTemplateService from "@/modules/shift-templates/shift-template.service";
import {
  CreateShiftTemplateDto,
  ListShiftTemplatesQuery,
  UpdateShiftTemplateDto,
} from "@/modules/shift-templates/shift-template.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";

export async function create(req: Request, res: Response): Promise<void> {
  const template = await shiftTemplateService.createShiftTemplate(
    req.user!.companyId!,
    req.body as CreateShiftTemplateDto,
  );
  sendSuccess(res, template, 201);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const template = await shiftTemplateService.getShiftTemplateByIdOrThrow(req.user!.companyId!, id);
  sendSuccess(res, template);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const template = await shiftTemplateService.updateShiftTemplate(
    req.user!.companyId!,
    id,
    req.body as UpdateShiftTemplateDto,
  );
  sendSuccess(res, template);
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await shiftTemplateService.listShiftTemplates(
    req.user!.companyId!,
    req.query as unknown as ListShiftTemplatesQuery,
  );
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function archive(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const template = await shiftTemplateService.archiveShiftTemplate(req.user!.companyId!, id);
  sendSuccess(res, template);
}

export async function restore(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const template = await shiftTemplateService.restoreShiftTemplate(req.user!.companyId!, id);
  sendSuccess(res, template);
}
