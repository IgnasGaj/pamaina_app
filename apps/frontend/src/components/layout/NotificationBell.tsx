import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
import type { Notification } from '@/types/notification.types'

export function NotificationBell() {
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
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
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
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 && (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">No notifications yet.</p>
        )}
        {notifications.map((notification) => (
          <DropdownMenuItem
            key={notification.id}
            className="flex flex-col items-start gap-0.5 whitespace-normal"
            onClick={() => handleSelect(notification)}
          >
            <span className={`text-sm ${notification.readAt ? 'font-normal text-muted-foreground' : 'font-semibold'}`}>
              {notification.title}
            </span>
            <span className="text-xs text-muted-foreground">{notification.message}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
