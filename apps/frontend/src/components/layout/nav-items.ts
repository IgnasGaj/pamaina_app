import type { LucideIcon } from 'lucide-react'
import { Building2, CalendarRange, CalendarX, Clock, LayoutDashboard, Settings, UserCog, Users } from 'lucide-react'

import { PERMISSIONS, type PermissionKey, type SystemRoleKey } from '@/types/auth.types'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Visible if the user has any one of these permissions. */
  permission?: PermissionKey | PermissionKey[]
  roleKey?: SystemRoleKey
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users, permission: PERMISSIONS.EMPLOYEE_READ },
  { to: '/scheduler', label: 'Scheduler', icon: CalendarRange, permission: PERMISSIONS.SCHEDULE_READ },
  { to: '/shift-templates', label: 'Shift templates', icon: Clock, permission: PERMISSIONS.SHIFT_TEMPLATE_READ },
  { to: '/absence-types', label: 'Absence types', icon: CalendarX, permission: PERMISSIONS.ABSENCE_TYPE_READ },
  {
    to: '/organization',
    label: 'Organization',
    icon: Building2,
    permission: [PERMISSIONS.DEPARTMENT_READ, PERMISSIONS.POSITION_READ],
  },
  { to: '/users', label: 'Team members', icon: UserCog, permission: PERMISSIONS.USER_READ },
  { to: '/settings/company', label: 'Company settings', icon: Settings, roleKey: 'COMPANY_OWNER' },
]
