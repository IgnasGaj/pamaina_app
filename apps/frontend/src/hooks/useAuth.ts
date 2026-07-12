import { useMutation, useQueryClient } from '@tanstack/react-query'

import * as authApi from '@/api/auth.api'
import { useAuthStore } from '@/stores/auth.store'
import type { ChangePasswordPayload, LoginPayload, RegisterCompanyPayload } from '@/types/auth.types'

export function useLogin() {
  const setSession = useAuthStore((state) => state.setSession)
  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (session) => setSession(session),
  })
}

export function useRegisterCompany() {
  const setSession = useAuthStore((state) => state.setSession)
  return useMutation({
    mutationFn: (payload: RegisterCompanyPayload) => authApi.registerCompany(payload),
    onSuccess: (session) => setSession(session),
  })
}

export function useLogout() {
  const clearSession = useAuthStore((state) => state.clearSession)
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      clearSession()
      queryClient.clear()
    },
  })
}

export function useChangePassword() {
  const clearSession = useAuthStore((state) => state.clearSession)
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => authApi.changePassword(payload),
    onSuccess: () => clearSession(),
  })
}
