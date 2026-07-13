import { create } from 'zustand'

import type { AuthResponse, AuthUser, PermissionKey } from '@/types/auth.types'

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated'

interface AuthState {
  status: AuthStatus
  user: AuthUser | null
  accessToken: string | null
  setSession: (session: AuthResponse) => void
  clearSession: () => void
  markUnauthenticated: () => void
  updateUser: (patch: Partial<AuthUser>) => void
  hasPermission: (permission: PermissionKey) => boolean
  hasAnyPermission: (permissions: PermissionKey[]) => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,

  setSession: (session) =>
    set({
      status: 'authenticated',
      user: session.user,
      accessToken: session.tokens.accessToken,
    }),

  clearSession: () =>
    set({
      status: 'unauthenticated',
      user: null,
      accessToken: null,
    }),

  markUnauthenticated: () => set({ status: 'unauthenticated' }),

  updateUser: (patch) =>
    set((state) => (state.user ? { user: { ...state.user, ...patch } } : {})),

  hasPermission: (permission) => get().user?.permissions.includes(permission) ?? false,

  hasAnyPermission: (permissions) => {
    const userPermissions = get().user?.permissions
    if (!userPermissions) return false
    return permissions.some((permission) => userPermissions.includes(permission))
  },
}))

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken
}
