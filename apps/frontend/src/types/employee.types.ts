export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN'

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'

/** Record lifecycle status — distinct from EmploymentStatus. ARCHIVED is the module's soft-delete state. */
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

export type EmployeeSortBy = 'name' | 'hireDate' | 'createdAt'

export interface Employee {
  id: string
  companyId: string
  userId: string | null
  employeeCode: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  personalCode: string | null
  birthDate: string | null
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionTitle: string | null
  employmentType: EmploymentType
  employmentStatus: EmploymentStatus
  status: EmployeeStatus
  contractedWeeklyHours: number
  hireDate: string
  terminationDate: string | null
  isActive: boolean
  createdAt: string
}

export interface CreateEmployeePayload {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  personalCode?: string
  birthDate?: string
  employeeCode?: string
  departmentId?: string
  positionId?: string
  employmentType?: EmploymentType
  contractedWeeklyHours?: number
  hireDate: string
}

export interface UpdateEmployeePayload {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  personalCode?: string | null
  birthDate?: string | null
  departmentId?: string | null
  positionId?: string | null
  employmentType?: EmploymentType
  employmentStatus?: EmploymentStatus
  status?: Extract<EmployeeStatus, 'ACTIVE' | 'INACTIVE'>
  contractedWeeklyHours?: number
  terminationDate?: string | null
}

export interface ListEmployeesQuery {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
  positionId?: string
  employmentStatus?: EmploymentStatus
  status?: EmployeeStatus
  sortBy?: EmployeeSortBy
  sortOrder?: 'asc' | 'desc'
}
