export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR' | 'INTERN'

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED'

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
  employmentStatus: EmploymentStatus
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
  departmentId?: string | null
  positionId?: string | null
  employmentType?: EmploymentType
  employmentStatus?: EmploymentStatus
  contractedWeeklyHours?: number
  terminationDate?: string | null
  isActive?: boolean
}

export interface ListEmployeesQuery {
  page?: number
  pageSize?: number
  search?: string
  departmentId?: string
  positionId?: string
  employmentStatus?: EmploymentStatus
}
