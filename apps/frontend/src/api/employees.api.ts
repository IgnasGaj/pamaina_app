import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type {
  CreateEmployeePayload,
  CreateEmployeeResult,
  Employee,
  ListEmployeesQuery,
  UpdateEmployeePayload,
  UpdateOwnProfilePayload,
} from '@/types/employee.types'

export function listEmployees(query: ListEmployeesQuery = {}): Promise<PaginatedResult<Employee>> {
  return unwrapPaginated(apiClient.get('/employees', { params: query }))
}

export function getEmployee(id: string): Promise<Employee> {
  return unwrap(apiClient.get(`/employees/${id}`))
}

export function getOwnEmployee(): Promise<Employee> {
  return unwrap(apiClient.get('/employees/me'))
}

export function updateOwnEmployee(payload: UpdateOwnProfilePayload): Promise<Employee> {
  return unwrap(apiClient.patch('/employees/me', payload))
}

export function createEmployee(payload: CreateEmployeePayload): Promise<CreateEmployeeResult> {
  return unwrap(apiClient.post('/employees', payload))
}

export function updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
  return unwrap(apiClient.patch(`/employees/${id}`, payload))
}

export function archiveEmployee(id: string): Promise<Employee> {
  return unwrap(apiClient.post(`/employees/${id}/archive`))
}

export function restoreEmployee(id: string): Promise<Employee> {
  return unwrap(apiClient.post(`/employees/${id}/restore`))
}
