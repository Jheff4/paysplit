import type { TransactionFilters } from './api'

export const EMPTY_FILTERS: TransactionFilters = { type: 'all', status: '', search: '', from: '', to: '' }

export function dateRangeProblem(from: string, to: string, today: string): string | null {
  if (from && to && from > to) return 'The start date must be on or before the end date.'
  if (from && from > today) return 'The start date cannot be in the future.'
  return null
}

export function statementFilename(filters: TransactionFilters, today: string) {
  const range = filters.from || filters.to ? `${filters.from || 'start'}-to-${filters.to || today}` : today
  return `paysplit-statement-${range}.csv`
}
