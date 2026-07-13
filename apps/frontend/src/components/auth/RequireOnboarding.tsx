import { Navigate, Outlet } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth.store'

/** Redirects company users who haven't finished the onboarding wizard yet. Platform Super Admins have no company and are exempt. */
export function RequireOnboarding() {
  const user = useAuthStore((state) => state.user)

  if (user?.companyId && !user.onboardingCompletedAt) {
    return <Navigate to="/onboarding" replace />
  }

  return <Outlet />
}
