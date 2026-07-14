import type { EmploymentType } from '@/types/employee.types'

export type HolidaySource = 'default' | 'company'

export interface Holiday {
  /** "YYYY-MM-DD" */
  date: string
  name: string
  source: HolidaySource
}

export interface MonthlyHoursBreakdown {
  year: number
  month: number
  employmentType: EmploymentType
  employmentFraction: number
  calendarDays: number
  workingDays: number
  baseHours: number
  ruleReductionHours: number
  requiredHours: number
  holidays: Holiday[]
}

export interface MonthlyHoursQuery {
  year: number
  month: number
  employmentType: EmploymentType
}

export interface HolidaysQuery {
  year: number
  month?: number
}

export interface CompanyNonWorkingDay {
  id: string
  companyId: string
  /** "YYYY-MM-DD" */
  date: string
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreateNonWorkingDayPayload {
  date: string
  name: string
}
