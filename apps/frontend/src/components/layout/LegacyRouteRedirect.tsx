import { Navigate, useLocation } from 'react-router-dom'

/**
 * Redirects an old standalone route (e.g. /organization) to its new home
 * under /settings/*, preserving any query string (e.g. ?tab=positions) so
 * existing bookmarks/links still land on the right tab.
 */
export function LegacyRouteRedirect({ to }: { to: string }) {
  const location = useLocation()
  return <Navigate to={{ pathname: to, search: location.search, hash: location.hash }} replace />
}
