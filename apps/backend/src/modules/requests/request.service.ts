import { requestRepository } from "@/modules/requests/request.repository";
import { toRequestResponseDto } from "@/modules/requests/request.mapper";
import {
  CreateRequestDto,
  ListRequestsQuery,
  RequestResponseDto,
  ReviewRequestDto,
} from "@/modules/requests/request.dto";
import { employeeRepository } from "@/modules/employees/employee.repository";
import { absenceTypeRepository } from "@/modules/absence-types/absence-type.repository";
import { userRepository } from "@/modules/users/user.repository";
import { notifyUser, notifyUsers } from "@/modules/notifications/notification.service";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from "@/shared/errors";
import { PaginatedResult } from "@/shared/types/pagination.types";
import { buildPaginatedResult } from "@/shared/utils/pagination.util";

async function assertActiveAbsenceType(absenceTypeId: string, companyId: string): Promise<{ name: string }> {
  const absenceType = await absenceTypeRepository.findByIdInCompany(absenceTypeId, companyId);
  if (!absenceType) {
    throw new BadRequestError("The selected absence type does not belong to this company");
  }
  if (!absenceType.active) {
    throw new BadRequestError("This absence type has been archived and can no longer be requested");
  }
  return absenceType;
}

/**
 * Creates a request on behalf of `employeeId`. Self-service callers (plain
 * EMPLOYEE accounts) always pass their own resolved employee id here — see
 * request.controller.ts, which never trusts a client-supplied employeeId for
 * that case. Managers may pass any employeeId belonging to their company.
 */
export async function createRequest(
  companyId: string,
  employeeId: string,
  dto: CreateRequestDto,
): Promise<RequestResponseDto> {
  const employee = await employeeRepository.findByIdInCompany(employeeId, companyId);
  if (!employee) {
    throw new BadRequestError("The selected employee does not belong to this company");
  }
  await assertActiveAbsenceType(dto.absenceTypeId, companyId);

  const created = await requestRepository.create({
    companyId,
    employeeId,
    absenceTypeId: dto.absenceTypeId,
    startDate: dto.startDate,
    endDate: dto.endDate,
    comment: dto.comment,
  });

  const managers = await userRepository.findManagersForCompany(companyId);
  await notifyUsers(
    managers.map((manager) => ({
      companyId,
      userId: manager.id,
      type: "REQUEST_SUBMITTED",
      title: "New request submitted",
      message: `${employee.firstName} ${employee.lastName} submitted a ${created.absenceType.name.toLowerCase()} request.`,
      link: "/requests",
    })),
  );

  return toRequestResponseDto(created);
}

export async function getRequestByIdOrThrow(
  companyId: string,
  id: string,
  restrictToEmployeeId?: string,
): Promise<RequestResponseDto> {
  const request = await requestRepository.findByIdInCompany(id, companyId);
  if (!request) {
    throw new NotFoundError("Request");
  }
  if (restrictToEmployeeId && request.employeeId !== restrictToEmployeeId) {
    throw new ForbiddenError("You can only view your own requests");
  }
  return toRequestResponseDto(request);
}

export async function listRequests(
  companyId: string,
  query: ListRequestsQuery,
  restrictToEmployeeId?: string,
): Promise<PaginatedResult<RequestResponseDto>> {
  const { items, total } = await requestRepository.findMany(
    { companyId, status: query.status, employeeId: restrictToEmployeeId ?? query.employeeId },
    query,
  );
  return buildPaginatedResult(items.map(toRequestResponseDto), query, total);
}

export async function approveRequest(
  companyId: string,
  reviewerId: string,
  id: string,
  dto: ReviewRequestDto,
): Promise<RequestResponseDto> {
  const existing = await requestRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Request");
  }
  if (existing.status !== "PENDING") {
    throw new ConflictError("Only pending requests can be approved");
  }

  const updated = await requestRepository.update(id, {
    status: "APPROVED",
    reviewedAt: new Date(),
    reviewComment: dto.reviewComment,
    reviewer: { connect: { id: reviewerId } },
  });

  if (updated.employee.userId) {
    await notifyUser({
      companyId,
      userId: updated.employee.userId,
      type: "REQUEST_APPROVED",
      title: "Request approved",
      message: `Your ${updated.absenceType.name.toLowerCase()} request has been approved.`,
      link: "/my-requests",
    });
  }

  return toRequestResponseDto(updated);
}

export async function rejectRequest(
  companyId: string,
  reviewerId: string,
  id: string,
  dto: ReviewRequestDto,
): Promise<RequestResponseDto> {
  const existing = await requestRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Request");
  }
  if (existing.status !== "PENDING") {
    throw new ConflictError("Only pending requests can be rejected");
  }

  const updated = await requestRepository.update(id, {
    status: "REJECTED",
    reviewedAt: new Date(),
    reviewComment: dto.reviewComment,
    reviewer: { connect: { id: reviewerId } },
  });

  if (updated.employee.userId) {
    await notifyUser({
      companyId,
      userId: updated.employee.userId,
      type: "REQUEST_REJECTED",
      title: "Request rejected",
      message: `Your ${updated.absenceType.name.toLowerCase()} request has been rejected.`,
      link: "/my-requests",
    });
  }

  return toRequestResponseDto(updated);
}

/** Employees may withdraw their own request while it's still pending. */
export async function cancelRequest(companyId: string, employeeId: string, id: string): Promise<RequestResponseDto> {
  const existing = await requestRepository.findByIdInCompany(id, companyId);
  if (!existing) {
    throw new NotFoundError("Request");
  }
  if (existing.employeeId !== employeeId) {
    throw new ForbiddenError("You can only cancel your own requests");
  }
  if (existing.status !== "PENDING") {
    throw new ConflictError("Only pending requests can be cancelled");
  }

  const updated = await requestRepository.update(id, { status: "CANCELLED" });
  return toRequestResponseDto(updated);
}
