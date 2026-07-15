export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface EmployeeRequest {
  id: string
  companyId: string
  employeeId: string
  employeeName: string
  absenceTypeId: string
  absenceTypeName: string
  absenceTypeColor: string
  startDate: string
  endDate: string
  comment: string | null
  status: RequestStatus
  reviewedBy: string | null
  reviewerName: string | null
  reviewedAt: string | null
  reviewComment: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateRequestPayload {
  absenceTypeId: string
  startDate: string
  endDate: string
  comment?: string
  /** Only used when a manager submits on an employee's behalf. */
  employeeId?: string
}

export interface ReviewRequestPayload {
  reviewComment?: string
}

export interface ListRequestsQuery {
  page?: number
  pageSize?: number
  status?: RequestStatus
  employeeId?: string
}
