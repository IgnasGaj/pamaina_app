export type PositionSortBy = 'name' | 'createdAt' | 'employeeCount'

export type PositionStatusFilter = 'ACTIVE' | 'ARCHIVED'

export interface Position {
  id: string
  companyId: string
  departmentId: string | null
  departmentName: string | null
  title: string
  description: string | null
  color: string
  isActive: boolean
  isArchived: boolean
  employeeCount: number
  createdAt: string
}

export interface CreatePositionPayload {
  title: string
  description?: string
  color?: string
  departmentId?: string
}

export interface UpdatePositionPayload {
  title?: string
  description?: string
  color?: string
  departmentId?: string | null
  isActive?: boolean
}

export interface ListPositionsQuery {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
  status?: PositionStatusFilter
  sortBy?: PositionSortBy
  sortOrder?: 'asc' | 'desc'
}
