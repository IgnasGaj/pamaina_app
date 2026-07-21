export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REVOKED'

export interface EmployeeRequest {
  id: string
  companyId: string
  employeeId: string
  employeeName: string
  absenceTypeId: string
  absenceTypeCode: string
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
  /** Only meaningful for approve — how to handle days where a shift is already scheduled. Defaults server-side to 'remove'. */
  conflictResolution?: 'remove' | 'keep'
}

export interface ConflictPreviewEntry {
  date: string
  shiftTemplateName: string
}

export interface ListRequestsQuery {
  page?: number
  pageSize?: number
  status?: RequestStatus
  employeeId?: string
  /** Filters by the request's startDate, inclusive — used for "upcoming" dashboard widgets. */
  startDateFrom?: string
  startDateTo?: string
}
