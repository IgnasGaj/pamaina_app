import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications'
import { formatLongDateTime, type AppLocale } from '@/lib/date'
import type { Notification, NotificationType } from '@/types/notification.types'

/**
 * Mirrors NotificationBell's type->title mapping. Kept as a small local copy
 * rather than importing from the (desktop Topbar-shared) NotificationBell
 * component, so this mobile-only page never risks touching desktop code.
 */
const NOTIFICATION_TITLE_KEYS: Record<NotificationType, string> = {
  SCHEDULE_PUBLISHED: 'notifications.schedulePublished',
  REQUEST_SUBMITTED: 'notifications.requestSubmitted',
  REQUEST_APPROVED: 'notifications.vacationApproved',
  REQUEST_REJECTED: 'notifications.vacationRejected',
  SHIFT_ASSIGNED: 'notifications.newShiftAssigned',
  SHIFT_UPDATED: 'notifications.shiftUpdated',
}

export function NotificationsPage() {
  const { t, i18n } = useTranslation()
  const locale: AppLocale = i18n.language === 'en' ? 'en' : 'lt'
  const navigate = useNavigate()

  const notificationsQuery = useNotifications({ pageSize: 50 })
  const unreadQuery = useUnreadNotificationCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()

  const notifications = notificationsQuery.data?.items ?? []
  const unreadCount = unreadQuery.data?.count ?? 0

  function handleSelect(notification: Notification) {
    if (!notification.readAt) {
      markRead.mutate(notification.id)
    }
    if (notification.link) {
      void navigate(notification.link)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('topbar.notifications')}</h1>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()}>
            {t('topbar.markAllRead')}
          </Button>
        )}
      </div>

      {notificationsQuery.isLoading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t('common.loading')}
        </div>
      )}

      {!notificationsQuery.isLoading && notifications.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            {t('topbar.noNotifications')}
          </CardContent>
        </Card>
      )}

      {!notificationsQuery.isLoading && notifications.length > 0 && (
        <div className="space-y-2.5">
          {notifications.map((notification) => {
            const unread = !notification.readAt
            return (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleSelect(notification)}
                className="block w-full text-left"
              >
                <Card className={`rounded-2xl transition-colors ${unread ? 'border-primary/40 bg-primary/5' : ''}`}>
                  <CardContent className="flex items-start gap-3 py-3.5">
                    <span
                      className={`mt-1.5 size-2 shrink-0 rounded-full ${unread ? 'bg-primary' : 'bg-transparent'}`}
                      aria-hidden
                    />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${unread ? 'font-semibold' : 'font-medium text-muted-foreground'}`}>
                        {t(NOTIFICATION_TITLE_KEYS[notification.type])}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{notification.message}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatLongDateTime(notification.createdAt, locale)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
