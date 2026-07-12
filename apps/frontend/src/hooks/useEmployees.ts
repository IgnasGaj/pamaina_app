import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createEmployee, deleteEmployee, getEmployee, listEmployees, updateEmployee } from '@/api/employees.api'
import type { CreateEmployeePayload, ListEmployeesQuery, UpdateEmployeePayload } from '@/types/employee.types'

export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (query: ListEmployeesQuery) => [...employeeKeys.lists(), query] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
}

export function useEmployees(query: ListEmployeesQuery = {}) {
  return useQuery({
    queryKey: employeeKeys.list(query),
    queryFn: () => listEmployees(query),
  })
}

export function useEmployee(id: string | undefined) {
  return useQuery({
    queryKey: employeeKeys.detail(id ?? ''),
    queryFn: () => getEmployee(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => createEmployee(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}

export function useUpdateEmployee(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateEmployeePayload) => updateEmployee(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: employeeKeys.detail(id) })
    },
  })
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEmployee(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeKeys.lists() })
    },
  })
}
