export type ScheduleStatus = 'DRAFT' | 'PUBLISHED'

export interface ScheduleAssignment {
  id: string
  scheduleId: string
  employeeId: string
  employeeName: string
  contractId: string
  date: string
  shiftTemplateId: string
  notes: string | null
  updatedBy: string | null
  updatedByName: string | null
  createdAt: string
  updatedAt: string
}

export interface Schedule {
  id: string
  companyId: string
  year: number
  month: number
  status: ScheduleStatus
  createdBy: string
  updatedBy: string | null
  updatedByName: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  assignments: ScheduleAssignment[]
}

export interface ScheduleSummary {
  id: string
  companyId: string
  year: number
  month: number
  status: ScheduleStatus
  createdBy: string
  updatedBy: string | null
  updatedByName: string | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  assignmentCount: number
}

export interface CreateSchedulePayload {
  year: number
  month: number
}

export interface UpdateSchedulePayload {
  year?: number
  month?: number
}

export interface ListSchedulesQuery {
  page?: number
  pageSize?: number
  year?: number
  month?: number
  status?: ScheduleStatus
}

export interface CreateAssignmentPayload {
  scheduleId: string
  employeeId: string
  contractId: string
  date: string
  shiftTemplateId: string
  notes?: string
}

export interface UpdateAssignmentPayload {
  shiftTemplateId?: string
  notes?: string | null
}
