import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications'
import type { Notification, NotificationType } from '@/types/notification.types'

// Notifications are created server-side in English; the headline is
// re-derived from the stable `type` so it can be localized without a
// backend i18n rewrite. The `message` (which carries dynamic specifics)
// still comes through as returned by the API.
const NOTIFICATION_TITLE_KEYS: Record<NotificationType, string> = {
  SCHEDULE_PUBLISHED: 'notifications.schedulePublished',
  REQUEST_SUBMITTED: 'notifications.requestSubmitted',
  REQUEST_APPROVED: 'notifications.vacationApproved',
  REQUEST_REJECTED: 'notifications.vacationRejected',
  SHIFT_ASSIGNED: 'notifications.newShiftAssigned',
  SHIFT_UPDATED: 'notifications.shiftUpdated',
}

export function NotificationBell() {
  const { t } = useTranslation()
  const unreadQuery = useUnreadNotificationCount()
  const notificationsQuery = useNotifications({ pageSize: 8 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const navigate = useNavigate()

  const unreadCount = unreadQuery.data?.count ?? 0
  const notifications = notificationsQuery.data?.items ?? []

  function handleSelect(notification: Notification) {
    if (!notification.readAt) {
      markRead.mutate(notification.id)
    }
    if (notification.link) {
      void navigate(notification.link)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t('topbar.notifications')}>
          <Bell />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full p-0 text-[10px] leading-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <DropdownMenuLabel className="p-0">{t('topbar.notifications')}</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              {t('topbar.markAllRead')}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">{t('topbar.noNotifications')}</p>
        )}
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex flex-col items-start gap-0.5 whitespace-normal"
            onClick={() => handleSelect(notification)}
          >
            <span className={`text-sm ${notification.readAt ? 'font-normal text-muted-foreground' : 'font-semibold'}`}>
              {t(NOTIFICATION_TITLE_KEYS[notification.type])}
            </span>
            <span className="text-xs text-muted-foreground">{notification.message}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
