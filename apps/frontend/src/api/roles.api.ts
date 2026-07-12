import { apiClient, unwrap } from '@/lib/api-client'
import type { Role } from '@/types/role.types'

export function listRoles(): Promise<Role[]> {
  return unwrap(apiClient.get('/roles'))
}
