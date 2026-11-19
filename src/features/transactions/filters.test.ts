import { isoDateInZone } from '@/lib/dates'
import { EMPTY_FILTERS, dateRangeProblem, statementFilename } from './filters'

test('date ranges are calendar days compared as text, so no time zone can shift them', () => {
  expect(dateRangeProblem('2026-11-01', '2026-11-19', '2026-11-19')).toBeNull()
  expect(dateRangeProblem('2026-11-19', '2026-11-19', '2026-11-19')).toBeNull()
  expect(dateRangeProblem('2026-11-20', '2026-11-19', '2026-11-19')).toBe('The start date must be on or before the end date.')
  expect(dateRangeProblem('2026-11-20', '', '2026-11-19')).toBe('The start date cannot be in the future.')
})

test('"today" for a statement is the Lagos day, even late in the evening in Los Angeles', () => {
  const lateEveningInLA = new Date('2026-11-19T23:30:00Z')
  expect(isoDateInZone(lateEveningInLA)).toBe('2026-11-20')
})

test('statement file names say which period they cover', () => {
  expect(statementFilename(EMPTY_FILTERS, '2026-11-19')).toBe('paysplit-statement-2026-11-19.csv')
  expect(statementFilename({ ...EMPTY_FILTERS, from: '2026-11-01', to: '2026-11-15' }, '2026-11-19')).toBe(
    'paysplit-statement-2026-11-01-to-2026-11-15.csv',
  )
})
