import type { LucideIcon } from 'lucide-react'
import { Building2, CalendarX, Clock, Globe, Settings as SettingsIcon, Timer, UserCog } from 'lucide-react'

import { PERMISSIONS, type PermissionKey, type SystemRoleKey } from '@/types/auth.types'

export interface SettingsSection {
  to: string
  icon: LucideIcon
  /** i18n key for the section's title — reused verbatim from the section's own page header. */
  titleKey: string
  /** i18n key for the section's description — reused verbatim from the section's own page header. */
  descriptionKey: string
  /** Sub-area i18n keys shown as small tags under the description, e.g. Departments/Positions. */
  tagKeys?: string[]
  /** Visible if the user has any one of these permissions. */
  permission?: PermissionKey | PermissionKey[]
  roleKey?: SystemRoleKey
}

/**
 * Single source of truth for every "configuration module" grouped under
 * Nustatymai (Settings) — used by both the Settings hub (grouped cards) and
 * the desktop settings nav rail, so the two never drift out of sync.
 */
export const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    to: '/settings/organization',
    icon: Building2,
    titleKey: 'organization.title',
    descriptionKey: 'organization.description',
    tagKeys: ['organization.departmentsTab', 'organization.positionsTab'],
    permission: [PERMISSIONS.DEPARTMENT_READ, PERMISSIONS.POSITION_READ],
  },
  {
    to: '/settings/users',
    icon: UserCog,
    titleKey: 'users.title',
    descriptionKey: 'users.description',
    permission: PERMISSIONS.USER_READ,
  },
  {
    to: '/settings/shift-templates',
    icon: Clock,
    titleKey: 'shiftTemplates.title',
    descriptionKey: 'shiftTemplates.description',
    permission: PERMISSIONS.SHIFT_TEMPLATE_READ,
  },
  {
    to: '/settings/absence-types',
    icon: CalendarX,
    titleKey: 'absenceTypes.title',
    descriptionKey: 'absenceTypes.description',
    permission: PERMISSIONS.ABSENCE_TYPE_READ,
  },
  {
    to: '/settings/working-time',
    icon: Timer,
    titleKey: 'workingTime.title',
    descriptionKey: 'workingTime.description',
    permission: PERMISSIONS.WORKING_TIME_READ,
  },
  {
    to: '/settings/localization',
    icon: Globe,
    titleKey: 'settings.localizationTitle',
    descriptionKey: 'settings.localizationDescription',
    roleKey: 'COMPANY_OWNER',
  },
  {
    to: '/settings/company',
    icon: SettingsIcon,
    titleKey: 'settings.companyTitle',
    descriptionKey: 'settings.companyDescription',
    roleKey: 'COMPANY_OWNER',
  },
]
