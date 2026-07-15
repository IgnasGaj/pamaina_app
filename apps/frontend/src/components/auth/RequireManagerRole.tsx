import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Walls off the entire manager application from EMPLOYEE-role accounts,
 * regardless of individual permission grants — some permissions (e.g.
 * SCHEDULE_READ, WORKING_TIME_READ) are intentionally shared between
 * Manager and Employee so each can hit their own scoped endpoints, but that
 * must never translate into employees reaching manager-only pages.
 */
export function RequireManagerRole() {
  const roleKey = useAuthStore((state) => state.user?.roleKey)

  if (roleKey === 'EMPLOYEE') {
    return <Navigate to="/my-dashboard" replace />
  }
  return <Outlet />
}
