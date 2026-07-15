import { apiClient, unwrap, unwrapPaginated } from '@/lib/api-client'
import type { PaginatedResult } from '@/types/api.types'
import type { ListNotificationsQuery, Notification } from '@/types/notification.types'

export function listNotifications(query: ListNotificationsQuery = {}): Promise<PaginatedResult<Notification>> {
  return unwrapPaginated(apiClient.get('/notifications', { params: query }))
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return unwrap(apiClient.get('/notifications/unread-count'))
}

export function markNotificationRead(id: string): Promise<void> {
  return unwrap(apiClient.post(`/notifications/${id}/read`))
}

export function markAllNotificationsRead(): Promise<void> {
  return unwrap(apiClient.post('/notifications/read-all'))
}
