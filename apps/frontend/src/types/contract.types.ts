export type ContractStatus = 'ACTIVE' | 'ENDED' | 'SUSPENDED' | 'DRAFT'

export type ContractType = 'PERMANENT' | 'FIXED_TERM' | 'SEASONAL' | 'TEMPORARY' | 'INTERNSHIP'

export type WorkWeek = 'FIVE_DAY' | 'SIX_DAY' | 'CUSTOM'

export interface EmploymentContract {
  id: string
  companyId: string
  employeeId: string
  employeeName: string
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionTitle: string | null
  contractNumber: string
  status: ContractStatus
  contractType: ContractType
  startDate: string
  endDate: string | null
  probationEndDate: string | null
  weeklyHours: number
  dailyHours: number
  fte: number
  workWeek: WorkWeek
  vacationDaysPerYear: number
  summarizedWorkingTime: boolean
  canWorkWeekends: boolean
  canWorkHolidays: boolean
  canWorkNights: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateContractPayload {
  employeeId: string
  departmentId?: string
  positionId?: string
  contractNumber?: string
  status?: ContractStatus
  contractType: ContractType
  startDate: string
  endDate?: string | null
  probationEndDate?: string | null
  weeklyHours?: number
  dailyHours?: number
  fte?: number
  workWeek?: WorkWeek
  vacationDaysPerYear?: number
  summarizedWorkingTime?: boolean
  canWorkWeekends?: boolean
  canWorkHolidays?: boolean
  canWorkNights?: boolean
  notes?: string
}

export interface UpdateContractPayload {
  departmentId?: string | null
  positionId?: string | null
  contractNumber?: string
  status?: ContractStatus
  contractType?: ContractType
  startDate?: string
  endDate?: string | null
  probationEndDate?: string | null
  weeklyHours?: number
  dailyHours?: number
  fte?: number
  workWeek?: WorkWeek
  vacationDaysPerYear?: number
  summarizedWorkingTime?: boolean
  canWorkWeekends?: boolean
  canWorkHolidays?: boolean
  canWorkNights?: boolean
  notes?: string | null
}

export interface EndContractPayload {
  endDate?: string
}

export interface ListContractsQuery {
  page?: number
  pageSize?: number
  employeeId?: string
  departmentId?: string
  positionId?: string
  status?: ContractStatus
}
