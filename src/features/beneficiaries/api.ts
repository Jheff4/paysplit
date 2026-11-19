import { api } from '@/api/client'
import type { Paged, Transaction } from '@/api/types'
import type { Category, LinkedRule } from '@/features/wallets/api'

export type Bank = { code: string; name: string }
export type ResolvedAccount = { bankCode: string; bankName: string; accountNumber: string; accountName: string }

export type Beneficiary = {
  id: string
  accountName: string
  bankName: string
  bankCode?: string
  accountNumber?: string
  maskedAccountNumber?: string
  status: 'active' | 'paused'
  narration?: string | null
  category?: Category | null
  categoryId?: string
  nextSplitDate?: string | null
  createdAt?: string
  rule?: LinkedRule | null
}

export type BeneficiaryDetail = Beneficiary & {
  totalAllocated?: number
  stats?: { totalAllocated?: number }
  linkedRule?: LinkedRule | null
}

export type BeneficiaryInput = { bankCode: string; accountNumber: string; categoryId: string; narration?: string }

export const beneficiaryKeys = {
  all: ['beneficiaries'] as const,
  list: (page: number, status: string, search: string) => ['beneficiaries', 'list', page, status, search] as const,
  detail: (id: string) => ['beneficiaries', 'detail', id] as const,
  transactions: (id: string, page: number, search: string) => ['beneficiaries', 'transactions', id, page, search] as const,
  banks: ['banks'] as const,
}

export const beneficiariesApi = {
  banks: () => api<Bank[]>('/banks'),
  resolve: (body: { bankCode: string; accountNumber: string }, signal?: AbortSignal) =>
    api<ResolvedAccount>('/beneficiaries/resolve', { method: 'POST', body, signal }),
  list: (page: number, status: string, search: string) =>
    api<Paged<Beneficiary>>('/beneficiaries', { query: { page, status, search } }),
  get: (id: string) => api<BeneficiaryDetail>(`/beneficiaries/${encodeURIComponent(id)}`),
  create: (body: BeneficiaryInput) => api<Beneficiary>('/beneficiaries', { method: 'POST', body }),
  update: (id: string, body: { categoryId?: string; narration?: string | null; status?: 'active' | 'paused' }) =>
    api<Beneficiary>(`/beneficiaries/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/beneficiaries/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  transactions: (id: string, page: number, search: string) =>
    api<Paged<Transaction>>(`/beneficiaries/${encodeURIComponent(id)}/transactions`, { query: { page, search } }),
}

export function maskAccountNumber(beneficiary: Pick<Beneficiary, 'maskedAccountNumber' | 'accountNumber'>) {
  if (beneficiary.maskedAccountNumber) return beneficiary.maskedAccountNumber
  const n = beneficiary.accountNumber ?? ''
  return n.length > 4 ? `*****${n.slice(-4)}` : n
}
