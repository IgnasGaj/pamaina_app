import { apiClient, unwrap } from '@/lib/api-client'
import type {
  Company,
  CompanySettings,
  UpdateCompanyPayload,
  UpdateCompanySettingsPayload,
} from '@/types/company.types'

export function getCompany(id: string): Promise<Company> {
  return unwrap(apiClient.get(`/companies/${id}`))
}

export function updateCompany(id: string, payload: UpdateCompanyPayload): Promise<Company> {
  return unwrap(apiClient.patch(`/companies/${id}`, payload))
}

export function getCompanySettings(id: string): Promise<CompanySettings> {
  return unwrap(apiClient.get(`/companies/${id}/settings`))
}

export function updateCompanySettings(id: string, payload: UpdateCompanySettingsPayload): Promise<CompanySettings> {
  return unwrap(apiClient.patch(`/companies/${id}/settings`, payload))
}

export function completeOnboarding(id: string): Promise<CompanySettings> {
  return unwrap(apiClient.post(`/companies/${id}/onboarding/complete`))
}
