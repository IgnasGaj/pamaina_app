import { apiClient, unwrap } from '@/lib/api-client'
import type {
  AuthResponse,
  AuthUser,
  ChangePasswordPayload,
  LoginPayload,
  RegisterCompanyPayload,
} from '@/types/auth.types'

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return unwrap(apiClient.post('/auth/login', payload))
}

export function registerCompany(payload: RegisterCompanyPayload): Promise<AuthResponse> {
  return unwrap(apiClient.post('/auth/register-company', payload))
}

export function refresh(): Promise<AuthResponse> {
  return unwrap(apiClient.post('/auth/refresh'))
}

export function logout(): Promise<{ success: boolean }> {
  return unwrap(apiClient.post('/auth/logout'))
}

export function getCurrentUser(): Promise<AuthUser> {
  return unwrap(apiClient.get('/auth/me'))
}

export function changePassword(payload: ChangePasswordPayload): Promise<{ success: boolean }> {
  return unwrap(apiClient.patch('/auth/password', payload))
}
