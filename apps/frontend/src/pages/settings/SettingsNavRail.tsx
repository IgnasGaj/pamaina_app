import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { isNavEntryVisible } from '@/components/layout/nav-items'
import { SETTINGS_SECTIONS } from '@/components/layout/settings-sections'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Desktop-only quick-switch between settings sections, so a manager already
 * inside e.g. Absence Types can jump straight to Working Time without going
 * back to the Nustatymai hub first. Hidden on mobile — there the hub's card
 * list (SettingsPage) is the only navigation, per the "simple list" spec.
 */
export function SettingsNavRail() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  const visibleSections = SETTINGS_SECTIONS.filter((section) => isNavEntryVisible(section, user, hasAnyPermission))

  return (
    <nav className="hidden shrink-0 space-y-0.5 md:block md:w-56">
      {visibleSections.map((section) => (
        <NavLink
          key={section.to}
          to={section.to}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
              isActive && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
            )
          }
        >
          <section.icon className="size-4" />
          {t(section.titleKey)}
        </NavLink>
      ))}
    </nav>
  )
}
