import { toInternationalPhone } from './phone'

test('a Nigerian local number with its leading 0 becomes +234 format', () => {
  expect(toInternationalPhone('0803 456 7890', '+234')).toBe('+2348034567890')
})

test('a number typed without the leading 0 gets the dial code', () => {
  expect(toInternationalPhone('803-456-7890', '+234')).toBe('+2348034567890')
})

test('a number already in international format is kept, only cleaned', () => {
  expect(toInternationalPhone('+44 7700 900123', '+234')).toBe('+447700900123')
})
