export type ParsePercentResult = { ok: true; basisPoints: number } | { ok: false; message: string }

export function parsePercent(input: string): ParsePercentResult {
  const text = input.trim().replace(/%$/, '').trim()
  if (text === '') return { ok: false, message: 'Enter a percentage.' }
  const match = /^(\d{1,3})(?:\.(\d*))?$/.exec(text)
  if (!match) return { ok: false, message: 'Enter a percentage using numbers only, for example 12.5.' }
  const fraction = match[2] ?? ''
  if (fraction.length > 2) return { ok: false, message: 'Use at most 2 decimal places.' }
  const basisPoints = Number(match[1]) * 100 + Number(fraction.padEnd(2, '0'))
  if (basisPoints <= 0) return { ok: false, message: 'Enter a percentage above 0.' }
  if (basisPoints > 10_000) return { ok: false, message: 'A percentage cannot be more than 100.' }
  return { ok: true, basisPoints }
}

export function basisPointsToPercent(basisPoints: number): number {
  return basisPoints / 100
}

export function percentToBasisPoints(percent: number): number {
  return Math.round(percent * 100)
}

export function percentOf(amountMinor: number, basisPoints: number): number {
  return Number((BigInt(amountMinor) * BigInt(basisPoints)) / 10_000n)
}

export function ruleMonthlyAmount(
  rule: { method: 'fixed' | 'percentage'; value: number },
  baseline: number | null,
): number | null {
  if (rule.method === 'fixed') return rule.value
  if (baseline === null) return null
  return percentOf(baseline, percentToBasisPoints(rule.value))
}

export type AllocationCheck =
  | { status: 'fits'; remainingAfter: number }
  | { status: 'over'; available: number; overBy: number }
  | { status: 'unknown' }

export function allocationCheck({
  baseline,
  allocatedByOthers,
  newAmount,
}: {
  baseline: number | null
  allocatedByOthers: number
  newAmount: number
}): AllocationCheck {
  if (baseline === null) return { status: 'unknown' }
  const available = Math.max(0, baseline - allocatedByOthers)
  if (newAmount > available) return { status: 'over', available, overBy: newAmount - available }
  return { status: 'fits', remainingAfter: available - newAmount }
}
