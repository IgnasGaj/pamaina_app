import { Request, Response } from "express";
import {
  deactivateCompany,
  getCompanyByIdOrThrow,
  listCompanies,
  updateCompany,
} from "@/modules/companies/company.service";
import {
  completeOnboarding,
  getOrCreateCompanySettings,
  updateCompanySettings,
} from "@/modules/companies/company-settings.service";
import { UpdateCompanyDto } from "@/modules/companies/company.dto";
import { UpdateCompanySettingsDto } from "@/modules/companies/company-settings.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";
import { ForbiddenError } from "@/shared/errors";
import { PaginationQuery } from "@/shared/types/pagination.types";
import { PERMISSIONS } from "@/shared/constants/permissions";

/** Super Admins (company.manage) may act on any company; everyone else only on their own. */
function assertCanAccessCompany(req: Request, companyId: string): void {
  const isPlatformAdmin = req.user!.permissions.includes(PERMISSIONS.COMPANY_MANAGE);
  if (!isPlatformAdmin && req.user!.companyId !== companyId) {
    throw new ForbiddenError("You cannot access another company's data");
  }
}

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listCompanies(req.query as unknown as PaginationQuery);
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  assertCanAccessCompany(req, id);
  const company = await getCompanyByIdOrThrow(id);
  sendSuccess(res, company);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  assertCanAccessCompany(req, id);
  const company = await updateCompany(id, req.body as UpdateCompanyDto);
  sendSuccess(res, company);
}

export async function remove(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  await deactivateCompany(id);
  sendSuccess(res, { id }, 200);
}

export async function getSettings(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  assertCanAccessCompany(req, id);
  const settings = await getOrCreateCompanySettings(id);
  sendSuccess(res, settings);
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  assertCanAccessCompany(req, id);
  const settings = await updateCompanySettings(id, req.body as UpdateCompanySettingsDto);
  sendSuccess(res, settings);
}

export async function completeOnboardingHandler(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  assertCanAccessCompany(req, id);
  const settings = await completeOnboarding(id);
  sendSuccess(res, settings);
}
