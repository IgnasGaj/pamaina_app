import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type {
  CreateDepartmentPayload,
  Department,
  ListDepartmentsQuery,
  UpdateDepartmentPayload,
} from '@/types/department.types'

export function listDepartments(query: ListDepartmentsQuery = {}): Promise<PaginatedResult<Department>> {
  return unwrapPaginated(apiClient.get('/departments', { params: query }))
}

export function getDepartment(id: string): Promise<Department> {
  return unwrap(apiClient.get(`/departments/${id}`))
}

export function createDepartment(payload: CreateDepartmentPayload): Promise<Department> {
  return unwrap(apiClient.post('/departments', payload))
}

export function updateDepartment(id: string, payload: UpdateDepartmentPayload): Promise<Department> {
  return unwrap(apiClient.patch(`/departments/${id}`, payload))
}

export function archiveDepartment(id: string): Promise<Department> {
  return unwrap(apiClient.post(`/departments/${id}/archive`))
}

export function restoreDepartment(id: string): Promise<Department> {
  return unwrap(apiClient.post(`/departments/${id}/restore`))
}
