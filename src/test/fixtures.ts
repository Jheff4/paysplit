import { http, HttpResponse } from 'msw'
import type { CashFlow, DashboardSummary, Onboarding } from '@/api/types'
import { apiUrl, server } from './utils'

export const newUserOnboarding: Onboarding = {
  emailVerified: true,
  passwordSet: true,
  profileCompleted: false,
  kycStatus: 'not_started',
  kyc: { identityStatus: 'not_started', livenessStatus: 'not_started' },
  setupChecklist: { salaryDateSet: false, hasWallet: false, hasBeneficiary: false, hasSplitRule: false, completed: false },
  progress: { signupCompleted: true, kycCompleted: false, setupCompleted: false, percent: 34 },
  nextStep: 'kyc',
}

export function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    firstName: 'Ada',
    tier: 1,
    salaryAccount: {
      status: 'not_issued',
      accountNumber: null,
      maskedAccountNumber: null,
      bankName: null,
      accounts: [],
      actionRequired: null,
      balance: 0,
      currency: 'NGN',
      accountName: 'Ada Obi',
    },
    income: null,
    splitAllocation: { amount: 0, activeRules: 0, percentOfSalary: 0 },
    wallets: { total: 0, activeCount: 0, withTargetCount: 0 },
    nextSplitRun: { date: null, fundStatus: 'unavailable' },
    partition: { baselineSalary: null, toWallets: 0, toBeneficiaries: 0, remaining: 0, remainingPercent: 0 },
    unreadNotifications: 0,
    onboarding: newUserOnboarding,
    ...overrides,
  }
}

export const emptyFlow: CashFlow = {
  from: '2026-03-01',
  to: '2026-11-19',
  granularity: 'month',
  buckets: [{ period: '2026-11', inflow: 0, toWallets: 0, toBeneficiaries: 0, movedBack: 0 }],
  totals: { inflow: 0, toWallets: 0, toBeneficiaries: 0, movedBack: 0 },
  monthOverMonth: { current: 0, previous: 0, changePercent: null },
}

export const emptyPage = { data: [], pagination: { total: 0, page: 1, limit: 5, pages: 0 } }

export function mockDashboard(data: DashboardSummary) {
  server.use(
    http.get(apiUrl('/dashboard/summary'), () => HttpResponse.json(data)),
    http.get(apiUrl('/dashboard/cash-flow'), () => HttpResponse.json(emptyFlow)),
    http.get(apiUrl('/transactions'), () => HttpResponse.json(emptyPage)),
    http.get(apiUrl('/wallets'), () => HttpResponse.json([])),
    http.get(apiUrl('/notifications'), () => HttpResponse.json({ ...emptyPage, unreadCount: 0 })),
  )
}
