export interface ApiSuccessBody<T> {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export interface ApiErrorBody {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export class ApiError extends Error {
  readonly code: string
  readonly statusCode: number
  readonly details?: unknown

  constructor(code: string, message: string, statusCode: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface PaginatedResult<T> {
  items: T[]
  meta: PaginationMeta
}

export interface PaginationQuery {
  page?: number
  pageSize?: number
}
