import { api } from '@/api/client'
import type { Paged, Transaction } from '@/api/types'

export type Category = { id: string; name: string; slug: string }

export type LinkedRule = {
  id: string
  name?: string
  method: 'fixed' | 'percentage'
  value: number
  priority?: number
  status?: 'active' | 'paused'
  updatedAt?: string
}

export type Wallet = {
  id: string
  name: string
  accentColor: string
  accentHex: string
  balance: number
  currency?: string
  targetAmount?: number | null
  progressPercent?: number | null
  category?: Category | null
  categoryId?: string
  createdAt?: string
  rule?: LinkedRule | null
}

export type WalletDetail = Wallet & {
  stats: { availableBalance: number; totalAllocated: number; totalMovedBack: number }
  linkedRule: LinkedRule | null
}

export type WalletInput = {
  name: string
  categoryId: string
  accentColor: string
  targetAmount: number | null
}

export type AccentColor = { key: string; hex: string }

export const walletKeys = {
  all: ['wallets'] as const,
  detail: (id: string) => ['wallets', 'detail', id] as const,
  transactions: (id: string, page: number, filter: string, search: string) =>
    ['wallets', 'transactions', id, page, filter, search] as const,
  activity: (page: number, direction: string, search: string) => ['wallets', 'activity', page, direction, search] as const,
}

export const categoryKeys = { all: ['categories'] as const }
export const accentKeys = { all: ['accent-colors'] as const }

export const walletsApi = {
  categories: () => api<Category[]>('/categories'),
  accentColors: () => api<AccentColor[]>('/wallets/accent-colors'),
  list: () => api<Wallet[]>('/wallets'),
  get: (id: string) => api<WalletDetail>(`/wallets/${encodeURIComponent(id)}`),
  create: (body: WalletInput) => api<Wallet>('/wallets', { method: 'POST', body }),
  update: (id: string, body: Partial<WalletInput>) =>
    api<Wallet>(`/wallets/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/wallets/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  move: (id: string, amount: number) =>
    api(`/wallets/${encodeURIComponent(id)}/move`, { method: 'POST', body: { amount } }),
  transactions: (id: string, page: number, filter: string, search: string) =>
    api<Paged<Transaction>>(`/wallets/${encodeURIComponent(id)}/transactions`, { query: { page, filter, search } }),
  activity: (page: number, direction: string, search: string) =>
    api<Paged<Transaction>>('/wallets/activity', { query: { page, direction, search } }),
}
