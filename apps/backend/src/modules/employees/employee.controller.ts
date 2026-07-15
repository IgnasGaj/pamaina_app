import { Request, Response } from "express";
import * as employeeService from "@/modules/employees/employee.service";
import {
  CreateEmployeeDto,
  ListEmployeesQuery,
  UpdateEmployeeDto,
  UpdateOwnProfileDto,
} from "@/modules/employees/employee.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";
import { ForbiddenError } from "@/shared/errors";

/**
 * Plain EMPLOYEE-role accounts only have `employee.read`, which grants
 * access to these routes at all — actual row-level scoping (their own
 * record only) is enforced here rather than relying on the permission
 * check alone.
 */
function isSelfServiceOnly(req: Request): boolean {
  return req.user!.roleKey === "EMPLOYEE";
}

export async function create(req: Request, res: Response): Promise<void> {
  const result = await employeeService.createEmployee(req.user!.companyId!, req.body as CreateEmployeeDto);
  sendSuccess(res, result, 201);
}

/** No id param needed — resolves the caller's own linked Employee record directly. */
export async function getOwnProfile(req: Request, res: Response): Promise<void> {
  const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
  sendSuccess(res, own);
}

/** Restricted to phone/email — every other field on the Employee record is manager-only. */
export async function updateOwnProfile(req: Request, res: Response): Promise<void> {
  const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
  const dto = req.body as UpdateOwnProfileDto;
  const employee = await employeeService.updateEmployee(req.user!.companyId!, own.id, {
    email: dto.email,
    phone: dto.phone,
  });
  sendSuccess(res, employee);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };

  if (isSelfServiceOnly(req)) {
    const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
    if (own.id !== id) {
      throw new ForbiddenError("You can only view your own employee record");
    }
    sendSuccess(res, own);
    return;
  }

  const employee = await employeeService.getEmployeeByIdOrThrow(req.user!.companyId!, id);
  sendSuccess(res, employee);
}

export async function update(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const employee = await employeeService.updateEmployee(req.user!.companyId!, id, req.body as UpdateEmployeeDto);
  sendSuccess(res, employee);
}

export async function list(req: Request, res: Response): Promise<void> {
  const restrictToUserId = isSelfServiceOnly(req) ? req.user!.id : undefined;
  const result = await employeeService.listEmployees(
    req.user!.companyId!,
    req.query as unknown as ListEmployeesQuery,
    restrictToUserId,
  );
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function archive(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const employee = await employeeService.archiveEmployee(req.user!.companyId!, id);
  sendSuccess(res, employee);
}

export async function restore(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const employee = await employeeService.restoreEmployee(req.user!.companyId!, id);
  sendSuccess(res, employee);
}
