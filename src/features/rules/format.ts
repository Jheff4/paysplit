import type { LinkedRule } from '@/features/wallets/api'
import { formatMoney } from '@/lib/money'

export function ruleValueLabel(rule: Pick<LinkedRule, 'method' | 'value'>, currency: string) {
  return rule.method === 'percentage' ? `${rule.value}%` : formatMoney(rule.value, currency)
}
