import { z } from 'zod'
import { formatMoney, parseMoneyInput } from './money'

const REASONS = {
  empty: 'Enter an amount.',
  invalid: 'Enter an amount using numbers only, for example 50,000.',
  too_many_decimals: 'This currency does not allow that many decimal places.',
  too_large: 'That amount is too large.',
} as const

export function moneyText(currency: string, options: { optional?: boolean; max?: number; maxLabel?: string } = {}) {
  return z.string().superRefine((value, ctx) => {
    if (!value.trim()) {
      if (!options.optional) ctx.addIssue({ code: 'custom', message: REASONS.empty })
      return
    }
    const parsed = parseMoneyInput(value, currency)
    if (!parsed.ok) {
      ctx.addIssue({ code: 'custom', message: REASONS[parsed.reason] })
      return
    }
    if (parsed.minor <= 0) ctx.addIssue({ code: 'custom', message: 'Enter an amount greater than zero.' })
    if (options.max !== undefined && parsed.minor > options.max) {
      ctx.addIssue({
        code: 'custom',
        message: `The most you can enter is ${options.maxLabel ?? formatMoney(options.max, currency)}.`,
      })
    }
  })
}

export function toMinor(value: string, currency: string): number {
  const parsed = parseMoneyInput(value, currency)
  if (!parsed.ok) throw new Error(`Invalid amount: ${parsed.reason}`)
  return parsed.minor
}
