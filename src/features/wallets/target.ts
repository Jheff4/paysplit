export function targetPercent(balance: number, target: number | null | undefined): number | null {
  if (!target || target <= 0) return null
  return Math.min(100, Math.floor((Math.max(0, balance) * 100) / target))
}
