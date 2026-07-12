import { Request, Response } from "express";
import * as positionService from "@/modules/positions/position.service";
import { CreatePositionDto, ListPositionsQuery, UpdatePositionDto } from "@/modules/positions/position.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";

export async function create(req: Request, res: Response): Promise<void> {
  const position = await positionService.createPosition(req.user!.companyId!, req.body as CreatePositionDto);
  sendSuccess(res, position, 201);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const position = await positionService.getPositionByIdOrThrow(req.user!.companyId!, id);
  sendSuccess(res, position);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const position = await positionService.updatePosition(req.user!.companyId!, id, req.body as UpdatePositionDto);
  sendSuccess(res, position);
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await positionService.listPositions(
    req.user!.companyId!,
    req.query as unknown as ListPositionsQuery,
  );
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await positionService.deletePosition(req.user!.companyId!, id);
  sendSuccess(res, { id });
}
