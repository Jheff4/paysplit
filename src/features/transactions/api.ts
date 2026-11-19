import { api } from '@/api/client'
import type { Paged, Transaction } from '@/api/types'

export type TransactionFilters = {
  type: 'all' | 'wallet' | 'beneficiary' | 'salary'
  status: '' | 'pending' | 'success' | 'failed' | 'reversed'
  search: string
  from: string
  to: string
}

export type TransactionDetail = Transaction & {
  destinationType?: string | null
  source?: string | null
  sourceName?: string | null
  providerReference?: string | null
  settlementReference?: string | null
  fee?: number | null
  failureReason?: string | null
  ruleName?: string | null
  splitRunId?: string | null
  completedAt?: string | null
}

export const transactionKeys = {
  all: ['transactions'] as const,
  list: (page: number, filters: TransactionFilters) => ['transactions', 'list', page, filters] as const,
  detail: (id: string) => ['transactions', 'detail', id] as const,
}

function query(filters: TransactionFilters) {
  return { type: filters.type, status: filters.status, search: filters.search, from: filters.from, to: filters.to }
}

export const transactionsApi = {
  list: (page: number, filters: TransactionFilters) =>
    api<Paged<Transaction>>('/transactions', { query: { page, ...query(filters) } }),
  get: (id: string) => api<TransactionDetail>(`/transactions/${encodeURIComponent(id)}`),
  exportCsv: (filters: TransactionFilters) => api<string>('/transactions/export', { query: query(filters) }),
}

export function downloadText(text: string, filename: string, type = 'text/csv') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
