import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveDepartment,
  createDepartment,
  getDepartment,
  listDepartments,
  restoreDepartment,
  updateDepartment,
} from '@/api/departments.api'
import type { CreateDepartmentPayload, ListDepartmentsQuery, UpdateDepartmentPayload } from '@/types/department.types'

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (query: ListDepartmentsQuery) => [...departmentKeys.lists(), query] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
}

export function useDepartments(query: ListDepartmentsQuery = {}) {
  return useQuery({
    queryKey: departmentKeys.list(query),
    queryFn: () => listDepartments(query),
  })
}

export function useDepartment(id: string | undefined) {
  return useQuery({
    queryKey: departmentKeys.detail(id ?? ''),
    queryFn: () => getDepartment(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
    },
  })
}

export function useUpdateDepartment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateDepartmentPayload) => updateDepartment(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) })
    },
  })
}

export function useArchiveDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveDepartment(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) })
    },
  })
}

export function useRestoreDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreDepartment(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) })
    },
  })
}
