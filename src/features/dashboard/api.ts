import { api } from '@/api/client'
import type { CashFlow, DashboardSummary, NotificationFeed, Paged, Transaction } from '@/api/types'

export const dashboardKeys = {
  summary: ['dashboard', 'summary'] as const,
  cashFlow: (from?: string, to?: string) => ['dashboard', 'cash-flow', from ?? null, to ?? null] as const,
}

export const dashboardApi = {
  summary: () => api<DashboardSummary>('/dashboard/summary'),
  cashFlow: (from?: string, to?: string) => api<CashFlow>('/dashboard/cash-flow', { query: { from, to } }),
  recentTransactions: (type: string, search: string) =>
    api<Paged<Transaction>>('/transactions', { query: { limit: 5, type, search } }),
  latestNotifications: () => api<NotificationFeed>('/notifications', { query: { limit: 3 } }),
}
