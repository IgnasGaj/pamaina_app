import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Forces accounts still on a system-generated temporary password (freshly
 * provisioned employees) through /change-password before reaching anything
 * else — they cannot skip this step by navigating directly to another URL.
 */
export function RequirePasswordChange() {
  const mustChangePassword = useAuthStore((state) => state.user?.mustChangePassword)

  if (mustChangePassword) {
    return <Navigate to="/change-password" replace />
  }
  return <Outlet />
}
