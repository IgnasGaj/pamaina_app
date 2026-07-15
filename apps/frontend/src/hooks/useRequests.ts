import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  approveRequest,
  cancelRequest,
  createRequest,
  getRequest,
  listRequests,
  rejectRequest,
} from '@/api/requests.api'
import type { CreateRequestPayload, ListRequestsQuery, ReviewRequestPayload } from '@/types/request.types'

export const requestKeys = {
  all: ['requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (query: ListRequestsQuery) => [...requestKeys.lists(), query] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
}

export function useRequests(query: ListRequestsQuery = {}) {
  return useQuery({
    queryKey: requestKeys.list(query),
    queryFn: () => listRequests(query),
  })
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: requestKeys.detail(id ?? ''),
    queryFn: () => getRequest(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRequestPayload) => createRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
  })
}

export function useApproveRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ReviewRequestPayload }) => approveRequest(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
  })
}

export function useRejectRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: ReviewRequestPayload }) => rejectRequest(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
  })
}

export function useCancelRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => cancelRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: requestKeys.lists() })
    },
  })
}
