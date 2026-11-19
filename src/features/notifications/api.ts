import { api } from '@/api/client'
import type { NotificationFeed, NotificationItem } from '@/api/types'

export const notificationKeys = {
  all: ['notifications'] as const,
  feed: (page: number, unreadOnly: boolean) => ['notifications', 'feed', page, unreadOnly] as const,
  badge: ['notifications', 'badge'] as const,
}

export const notificationsApi = {
  feed: (page: number, unreadOnly: boolean) =>
    api<NotificationFeed>('/notifications', { query: { page, limit: 10, unreadOnly: unreadOnly || undefined } }),
  badge: () => api<NotificationFeed>('/notifications', { query: { limit: 1 } }),
  markRead: (id: string) => api(`/notifications/${encodeURIComponent(id)}/read`, { method: 'POST' }),
  markAllRead: () => api('/notifications/read-all', { method: 'POST' }),
}

export function isUnread(item: NotificationItem) {
  if (item.isRead !== undefined) return !item.isRead
  return !item.readAt
}
