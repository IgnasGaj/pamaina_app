import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archiveShiftTemplate,
  createShiftTemplate,
  getShiftTemplate,
  listShiftTemplates,
  restoreShiftTemplate,
  updateShiftTemplate,
} from '@/api/shift-templates.api'
import type {
  CreateShiftTemplatePayload,
  ListShiftTemplatesQuery,
  UpdateShiftTemplatePayload,
} from '@/types/shift-template.types'

export const shiftTemplateKeys = {
  all: ['shift-templates'] as const,
  lists: () => [...shiftTemplateKeys.all, 'list'] as const,
  list: (query: ListShiftTemplatesQuery) => [...shiftTemplateKeys.lists(), query] as const,
  details: () => [...shiftTemplateKeys.all, 'detail'] as const,
  detail: (id: string) => [...shiftTemplateKeys.details(), id] as const,
}

export function useShiftTemplates(query: ListShiftTemplatesQuery = {}) {
  return useQuery({
    queryKey: shiftTemplateKeys.list(query),
    queryFn: () => listShiftTemplates(query),
  })
}

export function useShiftTemplate(id: string | undefined) {
  return useQuery({
    queryKey: shiftTemplateKeys.detail(id ?? ''),
    queryFn: () => getShiftTemplate(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateShiftTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateShiftTemplatePayload) => createShiftTemplate(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shiftTemplateKeys.lists() })
    },
  })
}

export function useUpdateShiftTemplate(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateShiftTemplatePayload) => updateShiftTemplate(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: shiftTemplateKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: shiftTemplateKeys.detail(id) })
    },
  })
}

export function useArchiveShiftTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archiveShiftTemplate(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: shiftTemplateKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: shiftTemplateKeys.detail(id) })
    },
  })
}

export function useRestoreShiftTemplate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restoreShiftTemplate(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: shiftTemplateKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: shiftTemplateKeys.detail(id) })
    },
  })
}
