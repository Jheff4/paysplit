import { api } from '@/api/client'
import type { Transaction } from '@/api/types'
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
}
