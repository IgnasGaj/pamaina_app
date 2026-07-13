import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

import { API_BASE_URL } from '@/lib/env'
import { useAuthStore } from '@/stores/auth.store'
import { ApiError, type ApiErrorBody, type ApiSuccessBody, type PaginatedResult, type PaginationMeta } from '@/types/api.types'
import type { AuthResponse } from '@/types/auth.types'

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
})

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

let refreshPromise: Promise<AuthResponse> | null = null

async function performRefresh(): Promise<AuthResponse> {
  const response = await axios.post<ApiSuccessBody<AuthResponse>>(
    `${API_BASE_URL}/auth/refresh`,
    {},
    { withCredentials: true },
  )
  return response.data.data
}

function isAuthEndpoint(url: string | undefined): boolean {
  return Boolean(url && (url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register-company')))
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true

      try {
        refreshPromise ??= performRefresh().finally(() => {
          refreshPromise = null
        })
        const session = await refreshPromise
        useAuthStore.getState().setSession(session)
        return apiClient(originalRequest)
      } catch {
        // Only reached once a real, previously-authenticated request's own
        // silent refresh has failed — never on the initial session check on
        // app load (that goes through /auth/refresh directly, which is
        // excluded above via isAuthEndpoint), so this always means an
        // active session just expired, not "never logged in".
        useAuthStore.getState().clearSession()
        toast.error('Your session has expired. Please login again.')
        return Promise.reject(new ApiError('UNAUTHORIZED', 'Your session has expired. Please login again.', 401))
      }
    }

    if (error.response?.data && 'error' in error.response.data) {
      const body = error.response.data
      return Promise.reject(
        new ApiError(body.error.code, body.error.message, error.response.status, body.error.details),
      )
    }

    return Promise.reject(
      new ApiError('NETWORK_ERROR', error.message || 'Network error, please try again.', error.response?.status ?? 0),
    )
  },
)

export async function unwrap<T>(promise: Promise<{ data: ApiSuccessBody<T> }>): Promise<T> {
  const response = await promise
  return response.data.data
}

/**
 * List endpoints send their items as `data` and pagination info nested under
 * `meta.pagination` (see shared/utils/api-response.util.ts on the backend).
 * This reshapes that envelope into the `{ items, meta }` shape list hooks
 * expect, instead of silently discarding pagination like a plain unwrap().
 */
export async function unwrapPaginated<T>(
  promise: Promise<{ data: ApiSuccessBody<T[]> }>,
): Promise<PaginatedResult<T>> {
  const response = await promise
  const pagination = response.data.meta?.pagination as PaginationMeta | undefined
  if (!pagination) {
    throw new Error('Expected a paginated response but no pagination metadata was returned')
  }
  return { items: response.data.data, meta: pagination }
}
