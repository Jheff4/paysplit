import { formatMoney, formatMoneyCompact, minorDigits, minorToInputString, parseMoneyInput } from './money'

describe('minorDigits', () => {
  test('comes from the currency, not a 2-decimal assumption', () => {
    expect(minorDigits('NGN')).toBe(2)
    expect(minorDigits('JPY')).toBe(0)
    expect(minorDigits('KWD')).toBe(3)
  })
})

describe('formatMoney', () => {
  test('formats kobo as naira', () => {
    expect(formatMoney(85_000_000, 'NGN')).toBe('₦850,000.00')
  })

  test('formats 0-decimal and 3-decimal currencies from minor units', () => {
    expect(formatMoney(1500, 'JPY', 'en-US')).toBe('¥1,500')
    expect(formatMoney(1_234_567, 'KWD', 'en-US')).toBe('KWD\u00a01,234.567')
  })

  test('keeps sub-unit precision exactly (no float drift)', () => {
    expect(formatMoney(1, 'NGN')).toBe('₦0.01')
    expect(formatMoney(10_000_000_000_001, 'NGN')).toBe('₦100,000,000,000.01')
  })

  test('formats negatives with a sign', () => {
    expect(formatMoney(-5_000_000, 'NGN')).toBe('-₦50,000.00')
  })

  test('rejects non-integer minor units instead of rounding silently', () => {
    expect(() => formatMoney(10.5, 'NGN')).toThrow(/integer/)
  })
})

describe('parseMoneyInput', () => {
  test('parses typed naira into kobo', () => {
    expect(parseMoneyInput('850,000', 'NGN')).toEqual({ ok: true, minor: 85_000_000 })
    expect(parseMoneyInput('₦ 1,234.5', 'NGN')).toEqual({ ok: true, minor: 123_450 })
    expect(parseMoneyInput('0.07', 'NGN')).toEqual({ ok: true, minor: 7 })
  })

  test('uses the locale decimal separator', () => {
    expect(parseMoneyInput('1.234,56', 'EUR', 'de-DE')).toEqual({ ok: true, minor: 123_456 })
  })

  test('respects 0 and 3 decimal currencies', () => {
    expect(parseMoneyInput('1,500', 'JPY', 'en-US')).toEqual({ ok: true, minor: 1500 })
    expect(parseMoneyInput('1.5', 'JPY', 'en-US')).toEqual({ ok: false, reason: 'too_many_decimals' })
    expect(parseMoneyInput('1.234', 'KWD', 'en-US')).toEqual({ ok: true, minor: 1234 })
    expect(parseMoneyInput('1.2345', 'KWD', 'en-US')).toEqual({ ok: false, reason: 'too_many_decimals' })
  })

  test('rejects things that are not a clean amount', () => {
    expect(parseMoneyInput('', 'NGN')).toEqual({ ok: false, reason: 'empty' })
    expect(parseMoneyInput('   ', 'NGN')).toEqual({ ok: false, reason: 'empty' })
    expect(parseMoneyInput('12.345', 'NGN')).toEqual({ ok: false, reason: 'too_many_decimals' })
    expect(parseMoneyInput('1.2.3', 'NGN')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseMoneyInput('abc', 'NGN')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseMoneyInput('-500', 'NGN')).toEqual({ ok: false, reason: 'invalid' })
    expect(parseMoneyInput('1e5', 'NGN')).toEqual({ ok: false, reason: 'invalid' })
  })

  test('rejects amounts beyond safe integer range', () => {
    expect(parseMoneyInput('999999999999999999', 'NGN')).toEqual({ ok: false, reason: 'too_large' })
  })
})

describe('minorToInputString', () => {
  test('prefills an edit field without grouping or float drift', () => {
    expect(minorToInputString(123_450, 'NGN')).toBe('1234.50')
    expect(minorToInputString(1500, 'JPY')).toBe('1500')
    expect(minorToInputString(1234, 'KWD')).toBe('1.234')
    expect(minorToInputString(5, 'NGN')).toBe('0.05')
  })
})

describe('headline amounts', () => {
  test('drop .00 only when there are no minor units, as in the Figma', () => {
    expect(formatMoney(85_000_000, 'NGN', undefined, { trimZeroMinor: true })).toBe('₦850,000')
    expect(formatMoney(85_000_050, 'NGN', undefined, { trimZeroMinor: true })).toBe('₦850,000.50')
    expect(formatMoney(1_234_000, 'KWD', 'en-US', { trimZeroMinor: true })).toBe('KWD 1,234')
    expect(formatMoney(1500, 'JPY', 'en-US', { trimZeroMinor: true })).toBe('¥1,500')
  })

  test('compact axis labels for charts', () => {
    expect(formatMoneyCompact(150_000_000, 'NGN')).toBe('₦1.5M')
    expect(formatMoneyCompact(4_500_000, 'NGN')).toBe('₦45K')
    expect(formatMoneyCompact(0, 'NGN')).toBe('₦0')
    expect(formatMoneyCompact(-2_500_000, 'NGN')).toBe('-₦25K')
  })
})
