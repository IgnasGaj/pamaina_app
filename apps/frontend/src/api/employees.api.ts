import { apiClient, unwrap } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type {
  CreateEmployeePayload,
  Employee,
  ListEmployeesQuery,
  UpdateEmployeePayload,
} from '@/types/employee.types'

export function listEmployees(query: ListEmployeesQuery = {}): Promise<PaginatedResult<Employee>> {
  return unwrap(apiClient.get('/employees', { params: query }))
}

export function getEmployee(id: string): Promise<Employee> {
  return unwrap(apiClient.get(`/employees/${id}`))
}

export function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  return unwrap(apiClient.post('/employees', payload))
}

export function updateEmployee(id: string, payload: UpdateEmployeePayload): Promise<Employee> {
  return unwrap(apiClient.patch(`/employees/${id}`, payload))
}

export function deleteEmployee(id: string): Promise<void> {
  return unwrap(apiClient.delete(`/employees/${id}`))
}
