import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createCompanyNonWorkingDay,
  deleteCompanyNonWorkingDay,
  getMonthlyHours,
  listCompanyNonWorkingDays,
  listHolidays,
} from '@/api/working-time.api'
import type { EmploymentType } from '@/types/employee.types'
import type { CreateNonWorkingDayPayload, HolidaysQuery, MonthlyHoursBreakdown } from '@/types/working-time.types'

/** Fixed set supported by the Working Time Engine — see EMPLOYMENT_FRACTIONS on the backend. */
export const ALL_EMPLOYMENT_TYPES: EmploymentType[] = ['FULL_TIME', 'PART_TIME_75', 'PART_TIME_50', 'PART_TIME_25']

export const workingTimeKeys = {
  all: ['working-time'] as const,
  monthlyHours: (year: number, month: number, employmentType: EmploymentType) =>
    [...workingTimeKeys.all, 'monthly-hours', year, month, employmentType] as const,
  holidays: (query: HolidaysQuery) => [...workingTimeKeys.all, 'holidays', query] as const,
  nonWorkingDays: () => [...workingTimeKeys.all, 'non-working-days'] as const,
}

export function useMonthlyHours(year: number, month: number, employmentType: EmploymentType) {
  return useQuery({
    queryKey: workingTimeKeys.monthlyHours(year, month, employmentType),
    queryFn: () => getMonthlyHours({ year, month, employmentType }),
  })
}

/**
 * Required hours depend only on (year, month, employmentType) — never on
 * the individual employee — so the Scheduler asks the engine once per
 * employment type (at most 4 calls) instead of once per employee, then maps
 * each employee to their type's result. This is the single place the
 * Scheduler talks to the Working Time Engine; it must never recompute the
 * formula itself.
 */
export function useMonthlyHoursByEmploymentType(year: number, month: number) {
  const results = useQueries({
    queries: ALL_EMPLOYMENT_TYPES.map((employmentType) => ({
      queryKey: workingTimeKeys.monthlyHours(year, month, employmentType),
      queryFn: () => getMonthlyHours({ year, month, employmentType }),
    })),
  })

  const byType = new Map<EmploymentType, MonthlyHoursBreakdown>()
  results.forEach((result, index) => {
    if (result.data) {
      byType.set(ALL_EMPLOYMENT_TYPES[index], result.data)
    }
  })

  return {
    byType,
    isLoading: results.some((result) => result.isLoading),
    isError: results.some((result) => result.isError),
  }
}

export function useHolidays(query: HolidaysQuery) {
  return useQuery({
    queryKey: workingTimeKeys.holidays(query),
    queryFn: () => listHolidays(query),
  })
}

export function useCompanyNonWorkingDays() {
  return useQuery({
    queryKey: workingTimeKeys.nonWorkingDays(),
    queryFn: () => listCompanyNonWorkingDays(),
  })
}

export function useCreateNonWorkingDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateNonWorkingDayPayload) => createCompanyNonWorkingDay(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workingTimeKeys.nonWorkingDays() })
      // Non-working days feed directly into the required-hours calculation.
      void queryClient.invalidateQueries({ queryKey: [...workingTimeKeys.all, 'monthly-hours'] })
      void queryClient.invalidateQueries({ queryKey: [...workingTimeKeys.all, 'holidays'] })
    },
  })
}

export function useDeleteNonWorkingDay() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCompanyNonWorkingDay(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workingTimeKeys.nonWorkingDays() })
      void queryClient.invalidateQueries({ queryKey: [...workingTimeKeys.all, 'monthly-hours'] })
      void queryClient.invalidateQueries({ queryKey: [...workingTimeKeys.all, 'holidays'] })
    },
  })
}
