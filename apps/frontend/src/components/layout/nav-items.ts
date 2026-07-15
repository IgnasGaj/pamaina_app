import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  CalendarRange,
  CalendarX,
  ClipboardList,
  Clock,
  Globe,
  LayoutDashboard,
  Settings,
  Timer,
  UserCog,
  Users,
} from 'lucide-react'

import { PERMISSIONS, type PermissionKey, type SystemRoleKey } from '@/types/auth.types'

export interface NavItem {
  to: string
  /** i18n key under the "nav" namespace, e.g. "nav.dashboard". */
  labelKey: string
  icon: LucideIcon
  /** Visible if the user has any one of these permissions. */
  permission?: PermissionKey | PermissionKey[]
  roleKey?: SystemRoleKey
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/employees', labelKey: 'nav.employees', icon: Users, permission: PERMISSIONS.EMPLOYEE_READ },
  { to: '/scheduler', labelKey: 'nav.scheduler', icon: CalendarRange, permission: PERMISSIONS.SCHEDULE_READ },
  {
    to: '/shift-templates',
    labelKey: 'nav.shiftTemplates',
    icon: Clock,
    permission: PERMISSIONS.SHIFT_TEMPLATE_READ,
  },
  { to: '/absence-types', labelKey: 'nav.absenceTypes', icon: CalendarX, permission: PERMISSIONS.ABSENCE_TYPE_READ },
  {
    to: '/settings/working-time',
    labelKey: 'nav.workingTime',
    icon: Timer,
    permission: PERMISSIONS.WORKING_TIME_READ,
  },
  {
    to: '/organization',
    labelKey: 'nav.organization',
    icon: Building2,
    permission: [PERMISSIONS.DEPARTMENT_READ, PERMISSIONS.POSITION_READ],
  },
  { to: '/requests', labelKey: 'nav.employeeRequests', icon: ClipboardList, permission: PERMISSIONS.REQUEST_MANAGE },
  { to: '/users', labelKey: 'nav.teamMembers', icon: UserCog, permission: PERMISSIONS.USER_READ },
  { to: '/settings/company', labelKey: 'nav.companySettings', icon: Settings, roleKey: 'COMPANY_OWNER' },
  { to: '/settings/localization', labelKey: 'nav.localizationSettings', icon: Globe, roleKey: 'COMPANY_OWNER' },
]
