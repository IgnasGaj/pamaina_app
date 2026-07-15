import { RequestWithRelations } from "@/modules/requests/request.repository";
import { RequestResponseDto } from "@/modules/requests/request.dto";

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function toRequestResponseDto(request: RequestWithRelations): RequestResponseDto {
  return {
    id: request.id,
    companyId: request.companyId,
    employeeId: request.employeeId,
    employeeName: `${request.employee.firstName} ${request.employee.lastName}`,
    absenceTypeId: request.absenceTypeId,
    absenceTypeName: request.absenceType.name,
    absenceTypeColor: request.absenceType.color,
    startDate: toDateOnly(request.startDate),
    endDate: toDateOnly(request.endDate),
    comment: request.comment,
    status: request.status,
    reviewedBy: request.reviewedBy,
    reviewerName: request.reviewer ? `${request.reviewer.firstName} ${request.reviewer.lastName}` : null,
    reviewedAt: request.reviewedAt ? request.reviewedAt.toISOString() : null,
    reviewComment: request.reviewComment,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  };
}
