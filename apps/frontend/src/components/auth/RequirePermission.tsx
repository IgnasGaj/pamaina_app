import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth.store'
import type { PermissionKey } from '@/types/auth.types'

export function RequirePermission({ anyOf }: { anyOf: PermissionKey[] }) {
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  if (!hasAnyPermission(anyOf)) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
