export type DepartmentSortBy = 'name' | 'createdAt' | 'employeeCount'

export type DepartmentStatusFilter = 'ACTIVE' | 'ARCHIVED'

export interface Department {
  id: string
  companyId: string
  name: string
  description: string | null
  color: string
  isActive: boolean
  isArchived: boolean
  employeeCount: number
  createdAt: string
}

export interface CreateDepartmentPayload {
  name: string
  description?: string
  color?: string
}

export interface UpdateDepartmentPayload {
  name?: string
  description?: string
  color?: string
  isActive?: boolean
}

export interface ListDepartmentsQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: DepartmentStatusFilter
  sortBy?: DepartmentSortBy
  sortOrder?: 'asc' | 'desc'
}
