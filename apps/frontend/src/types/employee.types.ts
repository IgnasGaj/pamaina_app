/** Record lifecycle status — this is not employment status, which now lives on EmploymentContract. ARCHIVED is the module's soft-delete state. */
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'

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
  personalCode: string | null
  birthDate: string | null
  status: EmployeeStatus
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
}

export interface UpdateEmployeePayload {
  firstName?: string
  lastName?: string
  email?: string | null
  phone?: string | null
  personalCode?: string | null
  birthDate?: string | null
  status?: Extract<EmployeeStatus, 'ACTIVE' | 'INACTIVE'>
}

export interface ListEmployeesQuery {
  page?: number
  pageSize?: number
  search?: string
  status?: EmployeeStatus
  sortBy?: EmployeeSortBy
  sortOrder?: 'asc' | 'desc'
}
