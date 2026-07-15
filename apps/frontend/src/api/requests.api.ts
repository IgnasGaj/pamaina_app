import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type {
  CreateRequestPayload,
  EmployeeRequest,
  ListRequestsQuery,
  ReviewRequestPayload,
} from '@/types/request.types'

export function listRequests(query: ListRequestsQuery = {}): Promise<PaginatedResult<EmployeeRequest>> {
  return unwrapPaginated(apiClient.get('/requests', { params: query }))
}

export function getRequest(id: string): Promise<EmployeeRequest> {
  return unwrap(apiClient.get(`/requests/${id}`))
}

export function createRequest(payload: CreateRequestPayload): Promise<EmployeeRequest> {
  return unwrap(apiClient.post('/requests', payload))
}

export function approveRequest(id: string, payload: ReviewRequestPayload = {}): Promise<EmployeeRequest> {
  return unwrap(apiClient.post(`/requests/${id}/approve`, payload))
}

export function rejectRequest(id: string, payload: ReviewRequestPayload = {}): Promise<EmployeeRequest> {
  return unwrap(apiClient.post(`/requests/${id}/reject`, payload))
}

export function cancelRequest(id: string): Promise<EmployeeRequest> {
  return unwrap(apiClient.post(`/requests/${id}/cancel`))
}
