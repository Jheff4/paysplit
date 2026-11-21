import { api } from '@/api/client'
import type { Paged, Transaction } from '@/api/types'

export type SkippedRule = {
  ruleId?: string
  ruleName?: string
  name?: string
  reason?: string
  requested?: number
  requestedAmount?: number
  available?: number
  availableAmount?: number
}

export type SplitRun = {
  id: string
  status: string
  trigger?: string
  createdAt: string
  completedAt?: string | null
  baseAmount: number
  availableAmount: number
  toWallets: number
  toBeneficiaries: number
  fees: number
  creditTransactionId?: string | null
  transactions?: Transaction[]
  skipped?: SkippedRule[]
}

export const runKeys = {
  all: ['split-runs'] as const,
  list: (page: number) => ['split-runs', 'list', page] as const,
  detail: (id: string) => ['split-runs', 'detail', id] as const,
}

export const runsApi = {
  runNow: () => api<SplitRun>('/split-runs', { method: 'POST' }),
  list: (page: number) => api<Paged<SplitRun>>('/split-runs', { query: { page } }),
  get: (id: string) => api<SplitRun>(`/split-runs/${encodeURIComponent(id)}`),
}

export function runStatusLabel(status: string) {
  const map: Record<string, string> = {
    success: 'Successful',
    successful: 'Successful',
    completed: 'Successful',
    partial: 'Partially completed',
    partially_completed: 'Partially completed',
    failed: 'Failed',
    pending: 'Pending',
    processing: 'Pending',
  }
  return map[status] ?? status.replace(/_/g, ' ')
}
