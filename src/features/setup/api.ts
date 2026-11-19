import { api } from '@/api/client'
import type { Income, Onboarding } from '@/api/types'

export const setupKeys = {
  income: ['setup', 'income'] as const,
  progress: ['setup', 'progress'] as const,
}

export const setupApi = {
  income: () => api<{ income: Income | null }>('/setup/income'),
  saveIncome: (body: { employerName: string; monthlyAmount: number; paydayDay: number }) =>
    api<{ income: Income; onboarding: Onboarding }>('/setup/income', { method: 'PUT', body }),
  progress: () => api<{ onboarding: Onboarding }>('/setup/progress'),
}
