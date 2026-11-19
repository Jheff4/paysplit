export const APP_TIME_ZONE = 'Africa/Lagos'
const LOCALE = 'en-NG'

const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: APP_TIME_ZONE,
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const calendarFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(instant: string | Date): string {
  return dateFormat.format(new Date(instant))
}

export function formatDateTime(instant: string | Date): string {
  return dateTimeFormat.format(new Date(instant))
}

export function isoDateInZone(instant: Date, timeZone: string = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}

export function formatCalendarDate(dateOnly: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly)
  if (!match) throw new RangeError(`Expected YYYY-MM-DD, got ${dateOnly}`)
  const [, y, m, d] = match.map(Number) as [number, number, number, number]
  const utc = new Date(Date.UTC(y, m - 1, d))
  if (utc.getUTCFullYear() !== y || utc.getUTCMonth() !== m - 1 || utc.getUTCDate() !== d) {
    throw new RangeError(`Not a real calendar date: ${dateOnly}`)
  }
  return calendarFormat.format(utc)
}

function partsInZone(instant: Date, timeZone: string = APP_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return { weekday: get('weekday'), month: get('month'), day: Number(get('day')), year: get('year'), hour: Number(get('hour')) }
}

export function greetingFor(instant: Date): string {
  const { hour } = partsInZone(instant)
  if (hour >= 5 && hour < 12) return 'Good Morning'
  if (hour >= 12 && hour < 17) return 'Good Afternoon'
  return 'Good Evening'
}

function ordinal(day: number): string {
  const tens = day % 100
  if (tens >= 11 && tens <= 13) return `${day}th`
  return `${day}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10] ?? 'th'}`
}

export function formatLongDate(instant: Date): { weekday: string; rest: string } {
  const { weekday, month, day, year } = partsInZone(instant)
  return { weekday, rest: `${month} ${ordinal(day)}, ${year}` }
}

const periodFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short', year: '2-digit' })

export function formatPeriod(period: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(period)
  if (!match) return period
  return periodFormat.format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1)))
}

export function formatDay(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? formatCalendarDate(value) : formatDate(value)
}
