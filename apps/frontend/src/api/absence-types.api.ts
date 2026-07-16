import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type { AbsenceType, ListAbsenceTypesQuery, UpdateAbsenceTypePayload } from '@/types/absence-type.types'

export function listAbsenceTypes(query: ListAbsenceTypesQuery = {}): Promise<PaginatedResult<AbsenceType>> {
  return unwrapPaginated(apiClient.get('/absence-types', { params: query }))
}

export function getAbsenceType(id: string): Promise<AbsenceType> {
  return unwrap(apiClient.get(`/absence-types/${id}`))
}

export function updateAbsenceType(id: string, payload: UpdateAbsenceTypePayload): Promise<AbsenceType> {
  return unwrap(apiClient.patch(`/absence-types/${id}`, payload))
}
