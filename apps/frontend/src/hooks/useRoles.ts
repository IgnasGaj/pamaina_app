import { useQuery } from '@tanstack/react-query'

import { listRoles } from '@/api/roles.api'

export const roleKeys = {
  all: ['roles'] as const,
  list: () => [...roleKeys.all, 'list'] as const,
}

export function useRoles() {
  return useQuery({
    queryKey: roleKeys.list(),
    queryFn: () => listRoles(),
  })
}
