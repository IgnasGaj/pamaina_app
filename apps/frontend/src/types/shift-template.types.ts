export type ShiftTemplateStatusFilter = 'ACTIVE' | 'ARCHIVED'

export type ShiftTemplateSortBy = 'name' | 'startTime' | 'createdAt'

export interface ShiftTemplate {
  id: string
  companyId: string
  name: string
  shortCode: string
  color: string
  /** 24h "HH:MM" time-of-day. */
  startTime: string
  endTime: string
  breakMinutes: number
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateShiftTemplatePayload {
  name: string
  shortCode: string
  color?: string
  startTime: string
  endTime: string
  breakMinutes?: number
}

export interface UpdateShiftTemplatePayload {
  name?: string
  shortCode?: string
  color?: string
  startTime?: string
  endTime?: string
  breakMinutes?: number
  active?: boolean
}

export interface ListShiftTemplatesQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: ShiftTemplateStatusFilter
  sortBy?: ShiftTemplateSortBy
  sortOrder?: 'asc' | 'desc'
}
