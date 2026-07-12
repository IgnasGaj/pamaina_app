import { Request, Response } from "express";
import * as userService from "@/modules/users/user.service";
import { CreateUserDto, ListUsersQuery, UpdateUserDto } from "@/modules/users/user.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";

export async function create(req: Request, res: Response): Promise<void> {
  const user = await userService.createUser(req.user!.companyId!, req.body as CreateUserDto);
  sendSuccess(res, user, 201);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const user = await userService.getUserByIdOrThrow(req.user!.companyId!, id);
  sendSuccess(res, user);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const user = await userService.updateUser(req.user!.companyId!, id, req.body as UpdateUserDto);
  sendSuccess(res, user);
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await userService.listUsers(req.user!.companyId!, req.query as unknown as ListUsersQuery);
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await userService.deleteUser(req.user!.companyId!, id, req.user!.id);
  sendSuccess(res, { id });
}
