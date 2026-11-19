import { APP_TIME_ZONE, formatCalendarDate, formatDate, formatDateTime, isoDateInZone } from './dates'

const nearMidnightUtc = '2026-11-18T23:30:00.000Z'

test('tests run outside Lagos so browser-zone bugs show up', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('America/Los_Angeles')
})

test('app zone is Lagos, which the API uses for day boundaries', () => {
  expect(APP_TIME_ZONE).toBe('Africa/Lagos')
})

describe('formatDate / formatDateTime', () => {
  test('a late-evening UTC instant is already the next day in Lagos', () => {
    expect(formatDate(nearMidnightUtc)).toBe('19 Nov 2026')
    expect(formatDateTime(nearMidnightUtc)).toBe('19 Nov 2026, 12:30 am')
  })

  test('does not shift to the viewer zone (Los Angeles would show 18 Nov, 3:30 PM)', () => {
    expect(formatDateTime(nearMidnightUtc)).not.toContain('18 Nov')
  })
})

describe('isoDateInZone', () => {
  test('gives the Lagos calendar day for API date filters', () => {
    expect(isoDateInZone(new Date(nearMidnightUtc))).toBe('2026-11-19')
    expect(isoDateInZone(new Date('2026-11-18T22:59:59.999Z'))).toBe('2026-11-18')
  })
})

describe('formatCalendarDate', () => {
  test('a date-only string is a calendar day, not an instant', () => {
    expect(formatCalendarDate('2026-10-18')).toBe('18 Oct 2026')
    expect(formatCalendarDate('2026-01-01')).toBe('1 Jan 2026')
  })

  test('rejects malformed date-only strings', () => {
    expect(() => formatCalendarDate('2026-13-01')).toThrow()
    expect(() => formatCalendarDate('18/10/2026')).toThrow()
  })
})
