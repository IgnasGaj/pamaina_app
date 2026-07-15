/** Record lifecycle status. ARCHIVED is the module's soft-delete state, only reachable via the archive endpoint. */
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

/** Multiplier fed into the Lithuanian Working Time Engine's monthly-required-hours calculation. */
export type EmploymentType = 'FULL_TIME' | 'PART_TIME_75' | 'PART_TIME_50' | 'PART_TIME_25'

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
  /** Required: every new employee automatically receives a linked login account. */
  email: string
  phone?: string
  departmentId?: string
  positionId?: string
  employmentType?: EmploymentType
  startDate: string
  endDate?: string | null
  notes?: string
  employeeCode?: string
}

/** Response for a create — the temporary password is only ever returned here, once. */
export interface CreateEmployeeResult {
  employee: Employee
  temporaryPassword: string
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

/** Self-service "my profile" update — every other Employee field is manager-only. */
export interface UpdateOwnProfilePayload {
  email?: string | null
  phone?: string | null
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
