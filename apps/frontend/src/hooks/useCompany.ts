import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { getCompany, updateCompany } from '@/api/companies.api'
import type { UpdateCompanyPayload } from '@/types/company.types'

export const companyKeys = {
  all: ['companies'] as const,
  detail: (id: string) => [...companyKeys.all, 'detail', id] as const,
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
