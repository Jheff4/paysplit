import { api } from '@/api/client'
import type { SalaryAccount, Transaction } from '@/api/types'
import type { SplitRun } from '@/features/runs/api'

export type SimulateCreditInput = { amount: number; senderName?: string; narration?: string }

export type SimulateCreditResult = {
  transaction: Transaction
  autoSplit: boolean
  splitRun: SplitRun | null
}

export const salaryApi = {
  simulateCredit: (body: SimulateCreditInput) =>
    api<SimulateCreditResult>('/salary-account/simulate-credit', { method: 'POST', body }),
  addIdentity: (body: { method: 'bvn' | 'nin'; idNumber: string }) =>
    api<SalaryAccount>('/salary-account/identity', { method: 'POST', body }),
}
