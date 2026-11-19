import {
  APP_TIME_ZONE,
  formatCalendarDate,
  formatDate,
  formatDateTime,
  formatDay,
  formatLongDate,
  formatPeriod,
  greetingFor,
  isoDateInZone,
} from './dates'

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

describe('dashboard date helpers', () => {
  test('the greeting follows the Lagos clock, not the viewer clock', () => {
    expect(greetingFor(new Date('2026-11-18T23:30:00Z'))).toBe('Good Evening')
    expect(greetingFor(new Date('2026-11-19T10:00:00Z'))).toBe('Good Morning')
    expect(greetingFor(new Date('2026-11-19T12:00:00Z'))).toBe('Good Afternoon')
    expect(greetingFor(new Date('2026-11-19T04:30:00Z'))).toBe('Good Morning')
  })

  test('the long date is the Lagos day with an ordinal', () => {
    expect(formatLongDate(new Date('2026-11-18T23:30:00Z'))).toEqual({ weekday: 'Thursday', rest: 'November 19th, 2026' })
    expect(formatLongDate(new Date('2026-12-01T12:00:00Z')).rest).toBe('December 1st, 2026')
    expect(formatLongDate(new Date('2026-12-22T12:00:00Z')).rest).toBe('December 22nd, 2026')
    expect(formatLongDate(new Date('2026-12-13T12:00:00Z')).rest).toBe('December 13th, 2026')
  })

  test('a YYYY-MM period becomes a short month label without time zone drift', () => {
    expect(formatPeriod('2026-06')).toBe('Jun 26')
    expect(formatPeriod('2026-01')).toBe('Jan 26')
  })
})

test('formatDay treats date-only values as calendar days and instants as Lagos days', () => {
  expect(formatDay('2026-11-28')).toBe('28 Nov 2026')
  expect(formatDay('2026-11-27T23:30:00.000Z')).toBe('28 Nov 2026')
})
