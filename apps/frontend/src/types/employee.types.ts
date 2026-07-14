/** Record lifecycle status. ARCHIVED is the module's soft-delete state, only reachable via the archive endpoint. */
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

/** Drives the placeholder monthly-required-hours calculation — see lib/monthly-hours.ts. */
export type EmploymentType = 'FULL_TIME' | 'PART_TIME'

export type EmployeeSortBy = 'name' | 'createdAt'

export interface Employee {
  id: string
  companyId: string
  userId: string | null
  employeeCode: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionTitle: string | null
  employmentType: EmploymentType
  startDate: string
  endDate: string | null
  notes: string | null
  status: EmployeeStatus
  isActive: boolean
  createdAt: string
}

export interface CreateEmployeePayload {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  departmentId?: string
  positionId?: string
  employmentType?: EmploymentType
  startDate: string
  endDate?: string | null
  notes?: string
  employeeCode?: string
}

export interface UpdateEmployeePayload {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  departmentId?: string | null
  positionId?: string | null
  employmentType?: EmploymentType
  startDate?: string
  endDate?: string | null
  notes?: string | null
  status?: Extract<EmployeeStatus, 'ACTIVE' | 'INACTIVE'>
}

export interface ListEmployeesQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: EmployeeStatus
  departmentId?: string
  positionId?: string
  sortBy?: EmployeeSortBy
  sortOrder?: 'asc' | 'desc'
}
