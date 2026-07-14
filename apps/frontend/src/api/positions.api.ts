import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type {
  CreatePositionPayload,
  ListPositionsQuery,
  Position,
  UpdatePositionPayload,
} from '@/types/position.types'

export function listPositions(query: ListPositionsQuery = {}): Promise<PaginatedResult<Position>> {
  return unwrapPaginated(apiClient.get('/positions', { params: query }))
}

export function getPosition(id: string): Promise<Position> {
  return unwrap(apiClient.get(`/positions/${id}`))
}

export function createPosition(payload: CreatePositionPayload): Promise<Position> {
  return unwrap(apiClient.post('/positions', payload))
}

export function updatePosition(id: string, payload: UpdatePositionPayload): Promise<Position> {
  return unwrap(apiClient.patch(`/positions/${id}`, payload))
}

export function archivePosition(id: string): Promise<Position> {
  return unwrap(apiClient.post(`/positions/${id}/archive`))
}

export function restorePosition(id: string): Promise<Position> {
  return unwrap(apiClient.post(`/positions/${id}/restore`))
}
