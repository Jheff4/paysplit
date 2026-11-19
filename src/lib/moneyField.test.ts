import { moneyText, toMinor } from './moneyField'

const issues = (schema: ReturnType<typeof moneyText>, value: string) => {
  const result = schema.safeParse(value)
  return result.success ? [] : result.error.issues.map((i) => i.message)
}

test('valid typed amounts convert to exact minor units', () => {
  expect(toMinor('1,500,000', 'NGN')).toBe(150_000_000)
  expect(toMinor('0.10', 'NGN')).toBe(10)
})

test('explains each kind of bad amount in plain words', () => {
  const schema = moneyText('NGN')
  expect(issues(schema, '')).toEqual(['Enter an amount.'])
  expect(issues(schema, '12.345')).toEqual(['This currency does not allow that many decimal places.'])
  expect(issues(schema, '0')).toEqual(['Enter an amount greater than zero.'])
  expect(issues(schema, 'ten')).toEqual(['Enter an amount using numbers only, for example 50,000.'])
})

test('optional amounts may be left empty', () => {
  expect(issues(moneyText('NGN', { optional: true }), '  ')).toEqual([])
})

test('a maximum is enforced in minor units and explained in money', () => {
  expect(issues(moneyText('NGN', { max: 5_000_000 }), '50,000.01')).toEqual(['The most you can enter is ₦50,000.00.'])
  expect(issues(moneyText('NGN', { max: 5_000_000 }), '50,000')).toEqual([])
})
