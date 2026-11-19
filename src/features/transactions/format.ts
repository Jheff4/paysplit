import type { Transaction } from '@/api/types'
import { formatMoney } from '@/lib/money'

export function signedMoney(tx: Transaction, fallbackCurrency: string) {
  const amount = tx.signedAmount ?? tx.amount
  const value = formatMoney(Math.abs(amount), tx.currency ?? fallbackCurrency)
  return amount < 0 ? `-${value}` : `+${value}`
}

export function txTitle(tx: Transaction) {
  return tx.destinationName ?? tx.description ?? tx.narration ?? tx.reference
}
