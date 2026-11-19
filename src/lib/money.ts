export const APP_LOCALE = 'en-NG'

export function minorDigits(currency: string): number {
  const digits = new Intl.NumberFormat('en', { style: 'currency', currency }).resolvedOptions()
    .maximumFractionDigits
  if (digits === undefined) throw new RangeError(`Unknown minor units for ${currency}`)
  return digits
}

function toDecimalString(minor: number, digits: number): `${number}` {
  if (!Number.isSafeInteger(minor)) {
    throw new RangeError(`Money must be a safe integer of minor units, got ${minor}`)
  }
  const sign = minor < 0 ? '-' : ''
  const abs = String(Math.abs(minor))
  if (digits === 0) return `${sign}${abs}` as `${number}`
  const padded = abs.padStart(digits + 1, '0')
  return `${sign}${padded.slice(0, -digits)}.${padded.slice(-digits)}` as `${number}`
}

export function formatMoney(
  minor: number,
  currency: string,
  locale: string = APP_LOCALE,
  options: { trimZeroMinor?: boolean } = {},
): string {
  const digits = minorDigits(currency)
  const whole = digits === 0 || minor % 10 ** digits === 0
  const fractionDigits = options.trimZeroMinor && whole ? 0 : digits
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(toDecimalString(minor, digits))
}

export function formatMoneyCompact(minor: number, currency: string, locale: string = APP_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(toDecimalString(Math.round(minor), minorDigits(currency)))
}

export function minorToInputString(minor: number, currency: string, locale: string = APP_LOCALE): string {
  return toDecimalString(minor, minorDigits(currency)).replace('.', separators(locale).decimal)
}

export type ParseMoneyResult =
  | { ok: true; minor: number }
  | { ok: false; reason: 'empty' | 'invalid' | 'too_many_decimals' | 'too_large' }

function separators(locale: string) {
  const parts = new Intl.NumberFormat(locale).formatToParts(12345.6)
  return {
    group: parts.find((p) => p.type === 'group')?.value ?? ',',
    decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
  }
}

function currencySymbols(currency: string, locale: string): string[] {
  const symbol = new Intl.NumberFormat(locale, { style: 'currency', currency })
    .formatToParts(1)
    .find((p) => p.type === 'currency')?.value
  return [currency, ...(symbol ? [symbol] : [])]
}

const SPACES = /[\s\u00a0\u202f]/g

export function parseMoneyInput(
  input: string,
  currency: string,
  locale: string = APP_LOCALE,
): ParseMoneyResult {
  const digits = minorDigits(currency)
  const { group, decimal } = separators(locale)

  let text = input
  for (const symbol of currencySymbols(currency, locale)) text = text.split(symbol).join('')
  text = text.replace(SPACES, '')
  if (text === '') return { ok: false, reason: 'empty' }

  const pieces = text.split(decimal)
  if (pieces.length > 2) return { ok: false, reason: 'invalid' }
  const [rawInteger = '', fraction = ''] = pieces

  const groupPattern = new RegExp(`^\\d{1,3}(${escapeRegExp(group)}\\d{3})*$`)
  const hasGroups = group.trim() !== '' && rawInteger.includes(group)
  if (hasGroups && !groupPattern.test(rawInteger)) return { ok: false, reason: 'invalid' }
  const integer = hasGroups ? rawInteger.split(group).join('') : rawInteger

  if (!/^\d*$/.test(integer) || !/^\d*$/.test(fraction)) return { ok: false, reason: 'invalid' }
  if (integer === '' && fraction === '') return { ok: false, reason: 'invalid' }
  if (fraction.length > digits) return { ok: false, reason: 'too_many_decimals' }

  const minorText = (integer + fraction.padEnd(digits, '0')).replace(/^0+(?=\d)/, '')
  const minor = Number(minorText)
  if (!Number.isSafeInteger(minor)) return { ok: false, reason: 'too_large' }
  return { ok: true, minor }
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
