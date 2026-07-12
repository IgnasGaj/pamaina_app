import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { createUser, deleteUser, getUser, listUsers, updateUser } from '@/api/users.api'
import type { CreateUserPayload, ListUsersQuery, UpdateUserPayload } from '@/types/user.types'

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (query: ListUsersQuery) => [...userKeys.lists(), query] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
}

export function useCompanyUsers(query: ListUsersQuery = {}) {
  return useQuery({
    queryKey: userKeys.list(query),
    queryFn: () => listUsers(query),
  })
}

export function useCompanyUser(id: string | undefined) {
  return useQuery({
    queryKey: userKeys.detail(id ?? ''),
    queryFn: () => getUser(id as string),
    enabled: Boolean(id),
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}

export function useUpdateUser(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateUserPayload) => updateUser(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
