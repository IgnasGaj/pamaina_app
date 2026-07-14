import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type {
  CreateContractPayload,
  EmploymentContract,
  EndContractPayload,
  ListContractsQuery,
  UpdateContractPayload,
} from '@/types/contract.types'

export function listContracts(query: ListContractsQuery = {}): Promise<PaginatedResult<EmploymentContract>> {
  return unwrapPaginated(apiClient.get('/contracts', { params: query }))
}

export function getContract(id: string): Promise<EmploymentContract> {
  return unwrap(apiClient.get(`/contracts/${id}`))
}

export function createContract(payload: CreateContractPayload): Promise<EmploymentContract> {
  return unwrap(apiClient.post('/contracts', payload))
}

export function updateContract(id: string, payload: UpdateContractPayload): Promise<EmploymentContract> {
  return unwrap(apiClient.patch(`/contracts/${id}`, payload))
}

export function endContract(id: string, payload: EndContractPayload = {}): Promise<EmploymentContract> {
  return unwrap(apiClient.post(`/contracts/${id}/end`, payload))
}

export function listContractsForEmployee(employeeId: string): Promise<EmploymentContract[]> {
  return unwrap(apiClient.get(`/employees/${employeeId}/contracts`))
}
