import { Request, Response } from "express";
import * as contractService from "@/modules/contracts/contract.service";
import * as employeeService from "@/modules/employees/employee.service";
import { CreateContractDto, EndContractDto, ListContractsQuery, UpdateContractDto } from "@/modules/contracts/contract.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";
import { ForbiddenError } from "@/shared/errors";

/**
 * Plain EMPLOYEE-role accounts only have `contract.read`, which grants
 * access to these routes at all — actual row-level scoping (their own
 * contracts only) is enforced here rather than relying on the permission
 * check alone, mirroring employee.controller.ts's isSelfServiceOnly.
 */
function isSelfServiceOnly(req: Request): boolean {
  return req.user!.roleKey === "EMPLOYEE";
}

export async function create(req: Request, res: Response): Promise<void> {
  const contract = await contractService.createContract(req.user!.companyId!, req.body as CreateContractDto);
  sendSuccess(res, contract, 201);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const contract = await contractService.getContractByIdOrThrow(req.user!.companyId!, id);

  if (isSelfServiceOnly(req)) {
    const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
    if (own.id !== contract.employeeId) {
      throw new ForbiddenError("You can only view your own contracts");
    }
  }

  sendSuccess(res, contract);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const contract = await contractService.updateContract(req.user!.companyId!, id, req.body as UpdateContractDto);
  sendSuccess(res, contract);
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListContractsQuery;

  if (isSelfServiceOnly(req)) {
    const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
    query.employeeId = own.id;
  }

  const result = await contractService.listContracts(req.user!.companyId!, query);
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function end(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const contract = await contractService.endContract(req.user!.companyId!, id, req.body as EndContractDto);
  sendSuccess(res, contract);
}
