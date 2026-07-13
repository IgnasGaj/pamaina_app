import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  completeOnboarding,
  getCompany,
  getCompanySettings,
  updateCompany,
  updateCompanySettings,
} from '@/api/companies.api'
import { useAuthStore } from '@/stores/auth.store'
import type { UpdateCompanyPayload, UpdateCompanySettingsPayload } from '@/types/company.types'

export const companyKeys = {
  all: ['companies'] as const,
  detail: (id: string) => [...companyKeys.all, 'detail', id] as const,
}

export const companySettingsKeys = {
  all: ['company-settings'] as const,
  detail: (id: string) => [...companySettingsKeys.all, 'detail', id] as const,
}

export function useCompany(id: string | undefined) {
  return useQuery({
    queryKey: companyKeys.detail(id ?? ''),
    queryFn: () => getCompany(id as string),
    enabled: Boolean(id),
  })
}

export function useUpdateCompany(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCompanyPayload) => updateCompany(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companyKeys.detail(id) })
    },
  })
}

export function useCompanySettings(id: string | undefined) {
  return useQuery({
    queryKey: companySettingsKeys.detail(id ?? ''),
    queryFn: () => getCompanySettings(id as string),
    enabled: Boolean(id),
  })
}

export function useUpdateCompanySettings(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateCompanySettingsPayload) => updateCompanySettings(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: companySettingsKeys.detail(id) })
    },
  })
}

export function useCompleteOnboarding(id: string) {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((state) => state.updateUser)
  return useMutation({
    mutationFn: () => completeOnboarding(id),
    onSuccess: (settings) => {
      updateUser({ onboardingCompletedAt: settings.onboardingCompletedAt })
      void queryClient.invalidateQueries({ queryKey: companySettingsKeys.detail(id) })
    },
  })
}
