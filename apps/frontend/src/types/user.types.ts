export interface CompanyUser {
  id: string
  companyId: string | null
  email: string
  firstName: string
  lastName: string
  phone: string | null
  roleId: string
  roleName: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface CreateUserPayload {
  firstName: string
  lastName: string
  email: string
  phone?: string
  password: string
  roleId: string
}

export interface UpdateUserPayload {
  firstName?: string
  lastName?: string
  phone?: string
  roleId?: string
  isActive?: boolean
}

export interface ListUsersQuery {
  page?: number
  pageSize?: number
  search?: string
  roleId?: string
}
