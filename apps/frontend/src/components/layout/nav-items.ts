import type { LucideIcon } from 'lucide-react'
import { Briefcase, Building2, LayoutDashboard, Settings, UserCog, Users } from 'lucide-react'

import { PERMISSIONS, type PermissionKey, type SystemRoleKey } from '@/types/auth.types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission?: PermissionKey
  roleKey?: SystemRoleKey
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users, permission: PERMISSIONS.EMPLOYEE_READ },
  { to: '/departments', label: 'Departments', icon: Building2, permission: PERMISSIONS.DEPARTMENT_READ },
  { to: '/positions', label: 'Positions', icon: Briefcase, permission: PERMISSIONS.POSITION_READ },
  { to: '/users', label: 'Team members', icon: UserCog, permission: PERMISSIONS.USER_READ },
  { to: '/settings/company', label: 'Company settings', icon: Settings, roleKey: 'COMPANY_OWNER' },
]
