export type AbsenceTypeStatusFilter = 'ACTIVE' | 'ARCHIVED'

export type AbsenceTypeSortBy = 'name' | 'createdAt'

export interface AbsenceType {
  id: string
  companyId: string
  name: string
  color: string
  paid: boolean
  active: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateAbsenceTypePayload {
  name: string
  color?: string
  paid?: boolean
}

export interface UpdateAbsenceTypePayload {
  name?: string
  color?: string
  paid?: boolean
  active?: boolean
}

export interface ListAbsenceTypesQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: AbsenceTypeStatusFilter
  sortBy?: AbsenceTypeSortBy
  sortOrder?: 'asc' | 'desc'
}
