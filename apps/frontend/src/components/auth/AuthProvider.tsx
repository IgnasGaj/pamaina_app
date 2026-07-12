import { useEffect, type ReactNode } from 'react'

import * as authApi from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'

export function AuthProvider({ children }: { children: ReactNode }) {
  const status = useAuthStore((state) => state.status)
  const setSession = useAuthStore((state) => state.setSession)
  const markUnauthenticated = useAuthStore((state) => state.markUnauthenticated)

  useEffect(() => {
    let cancelled = false

    authApi
      .refresh()
      .then((session) => {
        if (!cancelled) setSession(session)
      })
      .catch(() => {
        if (!cancelled) markUnauthenticated()
      })

    return () => {
      cancelled = true
    }
  }, [setSession, markUnauthenticated])

  if (status === 'idle') {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return children
}
