import { CalendarDays, ClipboardList, LayoutGrid, LogOut, User as UserIcon } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { NotificationBell } from '@/components/layout/NotificationBell'
import { Button } from '@/components/ui/button'
import { useLogout } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'

const TABS = [
  { to: '/my-dashboard', labelKey: 'portalNav.home', icon: LayoutGrid },
  { to: '/my-schedule', labelKey: 'portalNav.schedule', icon: CalendarDays },
  { to: '/my-requests', labelKey: 'portalNav.requests', icon: ClipboardList },
  { to: '/my-profile', labelKey: 'portalNav.profile', icon: UserIcon },
]

/**
 * Mobile-first shell for the Employee Portal — a bottom tab bar keeps every
 * screen one tap away, matching the "max three taps" requirement. Kept
 * entirely separate from AppShell (the manager sidebar layout) rather than
 * sharing a responsive layout, since the two audiences need fundamentally
 * different navigation shapes.
 */
export function EmployeeShell() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout.mutateAsync()
    void navigate('/login', { replace: true })
  }

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
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button variant="ghost" size="icon" aria-label={t('topbar.signOut')} onClick={() => void handleLogout()}>
            <LogOut />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-6">
        <Outlet />
      </main>

      <nav className="grid shrink-0 grid-cols-4 border-t border-border bg-background">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`
            }
          >
            <tab.icon className="size-6" />
            {t(tab.labelKey)}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
