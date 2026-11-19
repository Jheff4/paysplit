import { allocationCheck, parsePercent, percentOf, ruleMonthlyAmount } from './allocation'

describe('parsePercent', () => {
  test('accepts up to 2 decimals and returns basis points', () => {
    expect(parsePercent('20')).toEqual({ ok: true, basisPoints: 2000 })
    expect(parsePercent('12.5')).toEqual({ ok: true, basisPoints: 1250 })
    expect(parsePercent('0.01')).toEqual({ ok: true, basisPoints: 1 })
    expect(parsePercent('100')).toEqual({ ok: true, basisPoints: 10000 })
    expect(parsePercent(' 7.25% ')).toEqual({ ok: true, basisPoints: 725 })
  })

  test('rejects anything that is not a clean percentage', () => {
    expect(parsePercent('')).toMatchObject({ ok: false, message: 'Enter a percentage.' })
    expect(parsePercent('12.345')).toMatchObject({ ok: false, message: 'Use at most 2 decimal places.' })
    expect(parsePercent('0')).toMatchObject({ ok: false, message: 'Enter a percentage above 0.' })
    expect(parsePercent('100.01')).toMatchObject({ ok: false, message: 'A percentage cannot be more than 100.' })
    expect(parsePercent('ten')).toMatchObject({ ok: false })
    expect(parsePercent('-5')).toMatchObject({ ok: false })
  })
})

describe('percentOf', () => {
  test('rounds down to the kobo so a split never takes more than asked', () => {
    expect(percentOf(85_000_000, 1000)).toBe(8_500_000)
    expect(percentOf(100_001, 1250)).toBe(12_500)
    expect(percentOf(3, 3333)).toBe(0)
  })

  test('stays exact where floating point would round up and over-allocate by a kobo', () => {
    expect(Math.floor((1_000_000_050_001 * 9999) / 10_000)).toBe(999_900_049_996)
    expect(percentOf(1_000_000_050_001, 9999)).toBe(999_900_049_995)
  })
})

describe('ruleMonthlyAmount', () => {
  test('fixed rules are their value; percentage rules depend on the salary', () => {
    expect(ruleMonthlyAmount({ method: 'fixed', value: 5_000_000 }, 85_000_000)).toBe(5_000_000)
    expect(ruleMonthlyAmount({ method: 'percentage', value: 12.5 }, 85_000_000)).toBe(10_625_000)
    expect(ruleMonthlyAmount({ method: 'percentage', value: 10 }, null)).toBeNull()
  })
})

describe('allocationCheck', () => {
  test('a rule that fits leaves the right remainder', () => {
    expect(allocationCheck({ baseline: 85_000_000, allocatedByOthers: 61_250_000, newAmount: 10_000_000 })).toEqual({
      status: 'fits',
      remainingAfter: 13_750_000,
    })
  })

  test('a rule that would over-allocate the salary is caught with the shortfall', () => {
    expect(allocationCheck({ baseline: 85_000_000, allocatedByOthers: 61_250_000, newAmount: 30_000_000 })).toEqual({
      status: 'over',
      available: 23_750_000,
      overBy: 6_250_000,
    })
  })

  test('exactly 100% is allowed', () => {
    expect(allocationCheck({ baseline: 100, allocatedByOthers: 40, newAmount: 60 })).toEqual({ status: 'fits', remainingAfter: 0 })
  })

  test('without a salary baseline we cannot check, and say so', () => {
    expect(allocationCheck({ baseline: null, allocatedByOthers: 0, newAmount: 10 })).toEqual({ status: 'unknown' })
  })
})
