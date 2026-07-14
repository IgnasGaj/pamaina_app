import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveAbsenceType,
  createAbsenceType,
  getAbsenceType,
  listAbsenceTypes,
  restoreAbsenceType,
  updateAbsenceType,
} from '@/api/absence-types.api'
import type {
  CreateAbsenceTypePayload,
  ListAbsenceTypesQuery,
  UpdateAbsenceTypePayload,
} from '@/types/absence-type.types'

export const absenceTypeKeys = {
  all: ['absence-types'] as const,
  lists: () => [...absenceTypeKeys.all, 'list'] as const,
  list: (query: ListAbsenceTypesQuery) => [...absenceTypeKeys.lists(), query] as const,
  details: () => [...absenceTypeKeys.all, 'detail'] as const,
  detail: (id: string) => [...absenceTypeKeys.details(), id] as const,
}

export function useAbsenceTypes(query: ListAbsenceTypesQuery = {}) {
  return useQuery({
    queryKey: absenceTypeKeys.list(query),
    queryFn: () => listAbsenceTypes(query),
  })
}

export function useAbsenceType(id: string | undefined) {
  return useQuery({
    queryKey: absenceTypeKeys.detail(id ?? ''),
    queryFn: () => getAbsenceType(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateAbsenceType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAbsenceTypePayload) => createAbsenceType(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: absenceTypeKeys.lists() })
    },
  })
}

export function useUpdateAbsenceType(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAbsenceTypePayload) => updateAbsenceType(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: absenceTypeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: absenceTypeKeys.detail(id) })
    },
  })
}

export function useArchiveAbsenceType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveAbsenceType(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: absenceTypeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: absenceTypeKeys.detail(id) })
    },
  })
}

export function useRestoreAbsenceType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreAbsenceType(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: absenceTypeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: absenceTypeKeys.detail(id) })
    },
  })
}
