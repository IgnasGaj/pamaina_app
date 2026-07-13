import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type { CompanyUser, CreateUserPayload, ListUsersQuery, UpdateUserPayload } from '@/types/user.types'

export function listUsers(query: ListUsersQuery = {}): Promise<PaginatedResult<CompanyUser>> {
  return unwrapPaginated(apiClient.get('/users', { params: query }))
}

export function getUser(id: string): Promise<CompanyUser> {
  return unwrap(apiClient.get(`/users/${id}`))
}

export function createUser(payload: CreateUserPayload): Promise<CompanyUser> {
  return unwrap(apiClient.post('/users', payload))
}

export function updateUser(id: string, payload: UpdateUserPayload): Promise<CompanyUser> {
  return unwrap(apiClient.patch(`/users/${id}`, payload))
}

export function deleteUser(id: string): Promise<void> {
  return unwrap(apiClient.delete(`/users/${id}`))
}
