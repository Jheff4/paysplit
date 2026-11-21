import type { Transaction } from '@/api/types'
import { formatMoney } from '@/lib/money'

export function signedMoney(tx: Transaction, fallbackCurrency: string) {
  const amount = tx.signedAmount ?? tx.amount
  const value = formatMoney(Math.abs(amount), tx.currency ?? fallbackCurrency)
  return amount < 0 ? `-${value}` : `+${value}`
}

const DESTINATION_LABELS: Record<string, string> = {
  wallet: 'Wallet',
  beneficiary: 'Beneficiary',
  salary_account: 'Salary account',
}

export function destinationLabel(type: string | undefined) {
  if (!type) return undefined
  return DESTINATION_LABELS[type] ?? type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ')
}

export function txTitle(tx: Transaction) {
  return tx.title ?? tx.destination?.name ?? tx.narration ?? tx.reference
}
