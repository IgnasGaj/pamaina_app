export const PERMISSIONS = {
  COMPANY_MANAGE: 'company.manage',

  USER_CREATE: 'user.create',
  USER_READ: 'user.read',
  USER_UPDATE: 'user.update',
  USER_DELETE: 'user.delete',

  ROLE_READ: 'role.read',
  ROLE_MANAGE: 'role.manage',

  DEPARTMENT_CREATE: 'department.create',
  DEPARTMENT_READ: 'department.read',
  DEPARTMENT_UPDATE: 'department.update',
  DEPARTMENT_DELETE: 'department.delete',

  POSITION_CREATE: 'position.create',
  POSITION_READ: 'position.read',
  POSITION_UPDATE: 'position.update',
  POSITION_DELETE: 'position.delete',

  EMPLOYEE_CREATE: 'employee.create',
  EMPLOYEE_READ: 'employee.read',
  EMPLOYEE_UPDATE: 'employee.update',
  EMPLOYEE_DELETE: 'employee.delete',

  CONTRACT_CREATE: 'contract.create',
  CONTRACT_READ: 'contract.read',
  CONTRACT_UPDATE: 'contract.update',
} as const

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]

export type SystemRoleKey = 'SUPER_ADMIN' | 'COMPANY_OWNER' | 'MANAGER' | 'EMPLOYEE'

export interface AuthUser {
  id: string
  companyId: string | null
  email: string
  firstName: string
  lastName: string
  roleId: string
  roleKey: SystemRoleKey | null
  roleName: string
  permissions: PermissionKey[]
  onboardingCompletedAt: string | null
}

export interface AuthTokens {
  accessToken: string
  accessTokenExpiresAt: string
}

export interface AuthResponse {
  user: AuthUser
  tokens: AuthTokens
}

export interface LoginPayload {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterCompanyPayload {
  company: {
    name: string
    email: string
    phone?: string
    address?: string
    city?: string
    legalCode?: string
    vatCode?: string
  }
  owner: {
    firstName: string
    lastName: string
    email: string
    password: string
  }
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}
