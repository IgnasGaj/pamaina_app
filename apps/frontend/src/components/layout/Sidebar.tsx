import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { NAV_ITEMS } from '@/components/layout/nav-items'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth.store'

export function Sidebar() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const hasAnyPermission = useAuthStore((state) => state.hasAnyPermission)

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.roleKey && user?.roleKey !== item.roleKey) return false
    if (item.permission && !hasAnyPermission(Array.isArray(item.permission) ? item.permission : [item.permission]))
      return false
    return true
  })

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-6">
        <div className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
          P
        </div>
        <span className="text-base font-semibold tracking-tight">{t('nav.appName')}</span>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary',
              )
            }
          >
            <item.icon className="size-4" />
            {t(item.labelKey)}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
