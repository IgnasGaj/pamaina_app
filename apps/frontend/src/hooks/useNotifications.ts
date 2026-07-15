import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications.api'
import type { ListNotificationsQuery } from '@/types/notification.types'

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (query: ListNotificationsQuery) => [...notificationKeys.lists(), query] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
}

export function useNotifications(query: ListNotificationsQuery = {}) {
  return useQuery({
    queryKey: notificationKeys.list(query),
    queryFn: () => listNotifications(query),
  })
}

/** Polled so the bell badge stays roughly current without a push/websocket layer. */
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => getUnreadNotificationCount(),
    refetchInterval: 30000,
  })
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
    },
  })
}
