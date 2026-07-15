export type NotificationType =
  | 'SCHEDULE_PUBLISHED'
  | 'REQUEST_SUBMITTED'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'SHIFT_ASSIGNED'
  | 'SHIFT_UPDATED'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  link: string | null
  readAt: string | null
  createdAt: string
}

export interface ListNotificationsQuery {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
}
