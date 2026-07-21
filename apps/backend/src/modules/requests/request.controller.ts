import { Request, Response } from "express";
import * as requestService from "@/modules/requests/request.service";
import * as employeeService from "@/modules/employees/employee.service";
import { CreateRequestDto, ListRequestsQuery, ReviewRequestDto } from "@/modules/requests/request.dto";
import { sendSuccess } from "@/shared/utils/api-response.util";
import { BadRequestError } from "@/shared/errors";

/**
 * Plain EMPLOYEE-role accounts only ever act on their own records — every
 * handler below resolves their own employee id server-side and ignores any
 * employeeId the client might have sent, mirroring the established pattern
 * in employee.controller.ts.
 */
function isSelfServiceOnly(req: Request): boolean {
  return req.user!.roleKey === "EMPLOYEE";
}

export async function create(req: Request, res: Response): Promise<void> {
  const dto = req.body as CreateRequestDto;
  let employeeId: string;

  if (isSelfServiceOnly(req)) {
    const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
    employeeId = own.id;
  } else {
    if (!dto.employeeId) {
      throw new BadRequestError("employeeId is required when submitting a request on behalf of an employee");
    }
    employeeId = dto.employeeId;
  }

  const request = await requestService.createRequest(req.user!.companyId!, employeeId, dto);
  sendSuccess(res, request, 201);
}

export async function getById(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  let restrictToEmployeeId: string | undefined;

  if (isSelfServiceOnly(req)) {
    const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
    restrictToEmployeeId = own.id;
  }

  const request = await requestService.getRequestByIdOrThrow(req.user!.companyId!, id, restrictToEmployeeId);
  sendSuccess(res, request);
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListRequestsQuery;
  let restrictToEmployeeId: string | undefined;

  if (isSelfServiceOnly(req)) {
    const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
    restrictToEmployeeId = own.id;
  }

  const result = await requestService.listRequests(req.user!.companyId!, query, restrictToEmployeeId);
  sendSuccess(res, result.items, 200, { pagination: result.meta });
}

export async function getConflicts(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const conflicts = await requestService.getRequestConflicts(req.user!.companyId!, id);
  sendSuccess(res, conflicts);
}

export async function approve(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const request = await requestService.approveRequest(
    req.user!.companyId!,
    req.user!.id,
    id,
    req.body as ReviewRequestDto,
  );
  sendSuccess(res, request);
}

export async function reject(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const request = await requestService.rejectRequest(
    req.user!.companyId!,
    req.user!.id,
    id,
    req.body as ReviewRequestDto,
  );
  sendSuccess(res, request);
}

export async function revoke(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const request = await requestService.revokeApproval(
    req.user!.companyId!,
    req.user!.id,
    id,
    req.body as ReviewRequestDto,
  );
  sendSuccess(res, request);
}

export async function cancel(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const own = await employeeService.getOwnEmployeeProfileOrThrow(req.user!.companyId!, req.user!.id);
  const request = await requestService.cancelRequest(req.user!.companyId!, own.id, id);
  sendSuccess(res, request);
}
