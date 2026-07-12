import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '@/stores/auth.store'

export function ProtectedRoute() {
  const status = useAuthStore((state) => state.status)
  const location = useLocation()

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
