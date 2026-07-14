import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  archivePosition,
  createPosition,
  getPosition,
  listPositions,
  restorePosition,
  updatePosition,
} from '@/api/positions.api'
import type { CreatePositionPayload, ListPositionsQuery, UpdatePositionPayload } from '@/types/position.types'

export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  list: (query: ListPositionsQuery) => [...positionKeys.lists(), query] as const,
  details: () => [...positionKeys.all, 'detail'] as const,
  detail: (id: string) => [...positionKeys.details(), id] as const,
}

export function usePositions(query: ListPositionsQuery = {}) {
  return useQuery({
    queryKey: positionKeys.list(query),
    queryFn: () => listPositions(query),
  })
}

export function usePosition(id: string | undefined) {
  return useQuery({
    queryKey: positionKeys.detail(id ?? ''),
    queryFn: () => getPosition(id as string),
    enabled: Boolean(id),
  })
}

export function useCreatePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePositionPayload) => createPosition(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
    },
  })
}

export function useUpdatePosition(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePositionPayload) => updatePosition(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: positionKeys.detail(id) })
    },
  })
}

export function useArchivePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => archivePosition(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: positionKeys.detail(id) })
    },
  })
}

export function useRestorePosition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => restorePosition(id),
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: positionKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: positionKeys.detail(id) })
    },
  })
}
