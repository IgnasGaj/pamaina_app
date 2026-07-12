import { Request, Response } from "express";
import { listRolesForCompany } from "@/modules/roles/role.service";
import { sendSuccess } from "@/shared/utils/api-response.util";
import { ForbiddenError } from "@/shared/errors";

export async function listRoles(req: Request, res: Response): Promise<void> {
  if (!req.user?.companyId) {
    throw new ForbiddenError("This action requires a company-scoped account");
  }
  const roles = await listRolesForCompany(req.user.companyId);
  sendSuccess(res, roles);
}
