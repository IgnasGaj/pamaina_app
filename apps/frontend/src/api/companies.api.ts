import { apiClient, unwrap } from '@/lib/api-client'
import type { Company, UpdateCompanyPayload } from '@/types/company.types'

export function getCompany(id: string): Promise<Company> {
  return unwrap(apiClient.get(`/companies/${id}`))
}

export function updateCompany(id: string, payload: UpdateCompanyPayload): Promise<Company> {
  return unwrap(apiClient.patch(`/companies/${id}`, payload))
}
