import { api } from '@/api/client'
import type { Paged } from '@/api/types'

export type RuleStatus = 'active' | 'paused'
export type RuleMethod = 'fixed' | 'percentage'
export type DestinationType = 'wallet' | 'beneficiary'

export type SplitRule = {
  id: string
  name: string
  priority: number
  destinationType: DestinationType
  walletId?: string | null
  beneficiaryId?: string | null
  destinationName?: string
  destination?: { id: string; name: string; type?: DestinationType; bankName?: string } | null
  method: RuleMethod
  value: number
  status: RuleStatus
  allocatedThisMonth?: number
  monthlyAmount?: number | null
  createdAt: string
  updatedAt?: string
}

export type RuleSegment = { ruleId?: string; name: string; amount: number; percent: number; destinationType?: DestinationType }

export type RulesSummary = {
  baselineSalary: number | null
  totalAllocated: number
  allocatedPercent: number
  remainder: number
  remainderPercent: number
  overAllocated: boolean
  activeRules: number
  toWallets: number
  toBeneficiaries: number
  segments: RuleSegment[]
}

export type RuleInput = {
  name: string
  priority: number
  destinationType: DestinationType
  walletId?: string
  beneficiaryId?: string
  method: RuleMethod
  value: number
  status?: RuleStatus
}

export const ruleKeys = {
  all: ['split-rules'] as const,
  summary: ['split-rules', 'summary'] as const,
  list: (page: number, status: string, search: string) => ['split-rules', 'list', page, status, search] as const,
  active: ['split-rules', 'active'] as const,
  detail: (id: string) => ['split-rules', 'detail', id] as const,
}

export const rulesApi = {
  summary: () => api<RulesSummary>('/split-rules/summary'),
  list: (page: number, status: string, search: string, limit = 10) =>
    api<Paged<SplitRule>>('/split-rules', { query: { page, status, search, limit } }),
  get: (id: string) => api<SplitRule>(`/split-rules/${encodeURIComponent(id)}`),
  create: (body: RuleInput) => api<{ rule: SplitRule }>('/split-rules', { method: 'POST', body }),
  update: (id: string, body: Partial<RuleInput>) =>
    api<SplitRule>(`/split-rules/${encodeURIComponent(id)}`, { method: 'PATCH', body }),
  remove: (id: string) => api(`/split-rules/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}

export function ruleDestinationName(rule: SplitRule) {
  return rule.destination?.name ?? rule.destinationName ?? (rule.destinationType === 'wallet' ? 'Wallet' : 'Beneficiary')
}
