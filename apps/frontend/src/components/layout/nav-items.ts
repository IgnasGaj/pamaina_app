import type { LucideIcon } from 'lucide-react'
import { CalendarRange, ClipboardList, LayoutDashboard, Settings, Users } from 'lucide-react'

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

/**
 * Every configuration module (shift templates, absence types, working time,
 * organization, team members, company/localization settings) now lives
 * inside a single Nustatymai hub (see settings-sections.ts) instead of its
 * own sidebar entry — Pamaina's sidebar is intentionally kept to the small
 * set of pages a manager opens every day.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/scheduler', labelKey: 'nav.scheduler', icon: CalendarRange, permission: PERMISSIONS.SCHEDULE_READ },
  { to: '/employees', labelKey: 'nav.employees', icon: Users, permission: PERMISSIONS.EMPLOYEE_READ },
  { to: '/requests', labelKey: 'nav.employeeRequests', icon: ClipboardList, permission: PERMISSIONS.REQUEST_MANAGE },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]

/** Shared visibility rule for anything shaped like a NavItem/SettingsSection. */
export function isNavEntryVisible(
  entry: { permission?: PermissionKey | PermissionKey[]; roleKey?: SystemRoleKey },
  user: { roleKey: SystemRoleKey | null } | null,
  hasAnyPermission: (permissions: PermissionKey[]) => boolean,
): boolean {
  if (entry.roleKey && user?.roleKey !== entry.roleKey) return false
  if (entry.permission && !hasAnyPermission(Array.isArray(entry.permission) ? entry.permission : [entry.permission]))
    return false
  return true
}
