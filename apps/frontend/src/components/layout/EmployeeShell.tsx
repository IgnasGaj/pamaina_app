import { Bell, CalendarDays, ClipboardList, LayoutGrid, User as UserIcon } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'
import { useAuthStore } from '@/stores/auth.store'

const TABS = [
  { to: '/my-dashboard', labelKey: 'portalNav.home', icon: LayoutGrid },
  { to: '/my-schedule', labelKey: 'portalNav.schedule', icon: CalendarDays },
  { to: '/my-requests', labelKey: 'portalNav.requests', icon: ClipboardList },
  { to: '/my-profile', labelKey: 'portalNav.profile', icon: UserIcon },
]

/**
 * Mobile-first shell for the Employee Portal — a large-target bottom tab bar
 * keeps every screen one thumb-reach away. Kept entirely separate from
 * AppShell (the manager sidebar layout) since the two audiences need
 * fundamentally different navigation shapes. Notifications get their own
 * dedicated route here instead of AppShell/Topbar's dropdown popover, which
 * doesn't translate well to a small touch screen — this intentionally does
 * not touch NotificationBell/Topbar, which remain desktop-only.
 */
export function EmployeeShell() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const unreadQuery = useUnreadNotificationCount()
  const navigate = useNavigate()
  const unreadCount = unreadQuery.data?.count ?? 0

  if (!user) return null

  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            P
          </div>
          <span className="font-semibold">{t('nav.appName')}</span>
        </div>
        <button
          type="button"
          className="relative flex size-10 items-center justify-center rounded-full text-foreground active:bg-muted"
          aria-label={t('topbar.notifications')}
          onClick={() => void navigate('/my-notifications')}
        >
          <Bell className="size-6" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px] leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-6">
        <Outlet />
      </main>

      <nav
        className="grid shrink-0 grid-cols-4 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]"
        aria-label={t('nav.appName')}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex min-h-16 flex-col items-center justify-center gap-1 py-2 text-xs font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex size-9 items-center justify-center rounded-full ${isActive ? 'bg-primary/10' : ''}`}
                >
                  <tab.icon className="size-7" />
                </span>
                {t(tab.labelKey)}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
