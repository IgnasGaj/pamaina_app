import { apiClient, unwrap } from '@/lib/api-client'
import type {
  CompanyNonWorkingDay,
  CreateNonWorkingDayPayload,
  Holiday,
  HolidaysQuery,
  MonthlyHoursBreakdown,
  MonthlyHoursQuery,
} from '@/types/working-time.types'

export function getMonthlyHours(query: MonthlyHoursQuery): Promise<MonthlyHoursBreakdown> {
  return unwrap(apiClient.get('/working-time/monthly-hours', { params: query }))
}

export function listHolidays(query: HolidaysQuery): Promise<Holiday[]> {
  return unwrap(apiClient.get('/working-time/holidays', { params: query }))
}

export function listCompanyNonWorkingDays(): Promise<CompanyNonWorkingDay[]> {
  return unwrap(apiClient.get('/working-time/non-working-days'))
}

export function createCompanyNonWorkingDay(payload: CreateNonWorkingDayPayload): Promise<CompanyNonWorkingDay> {
  return unwrap(apiClient.post('/working-time/non-working-days', payload))
}

export function deleteCompanyNonWorkingDay(id: string): Promise<void> {
  return unwrap(apiClient.delete(`/working-time/non-working-days/${id}`))
}
